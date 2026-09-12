import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock, faUserTimes, faMoneyCheckAlt, faBriefcaseMedical, faBookReader,
  faUserCheck, faTrophy, faExclamationCircle, faAward, faTimes, faPrint, faDownload, faShareAlt
} from "@fortawesome/free-solid-svg-icons";

// Popup Component
const Popup = ({ title, content, onClose, downloadData }) => {
  const contentRef = useRef(null);

  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    background: "#fff",
    padding: "30px",
    borderRadius: "15px",
    width: "90%",
    maxWidth: "900px",
    maxHeight: "60vh",
    overflowY: "auto",
    position: "relative",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
    animation: "fadeIn 0.3s ease-out",
     scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
  };

  const closeBtnStyle = {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#e74c3c",
  };

  const headerStyle = {
    borderBottom: "3px solid #3498db",
    paddingBottom: "15px",
    marginBottom: "20px",
    fontSize: "1.8em",
    color: "#2c3e50",
    fontWeight: "600",
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
    borderTop: "1px solid #ecf0f1",
    paddingTop: "15px",
  };

  const actionBtnStyle = {
    padding: "6px 12px",
    background: "#2980B9",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  };

  const handlePrint = () => {
    const content = contentRef.current;
    if (content) {
      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write("<html><head><title>" + title + "</title>");
      printWindow.document.write("<style>");
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        thead tr { background-color: #f2f2f2; }
        ul { list-style-type: disc; padding-left: 20px; }
      `);
      printWindow.document.write("</style></head><body>");
      printWindow.document.write(`<h3>${title}</h3>`);
      printWindow.document.write(content.innerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownload = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data to download.");
      return;
    }

    const SEPARATOR = "\t";
    const headers = Object.keys(data[0]);
    const headerRow = headers
      .map((header) => `"${header.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}"`)
      .join(SEPARATOR);

    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          let value = row[header];
          if (typeof value === "undefined" || value === null) value = "";
          if (typeof value === "string") value = value.replace(/"/g, '""').replace(/,/g, "").replace(/\n/g, " ");
          return `"${value}"`;
        })
        .join(SEPARATOR)
    );

    const csvContent = [headerRow, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.xls`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    const shareData = {
      title: "Exam Management Report",
      text: `Check out the details for: ${title}`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => console.log("Content shared successfully"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      alert(`Sharing not supported. Copy the link: ${window.location.href}`);
    }
  };

  return (
    <>
      <div style={modalStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} style={closeBtnStyle} title="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <h3 style={headerStyle}>{title}</h3>
          <div style={buttonContainerStyle}>
            <button onClick={handlePrint} style={actionBtnStyle} title="Print Content">
              <FontAwesomeIcon icon={faPrint} />
            </button>
            <button onClick={() => handleDownload(downloadData, title)} style={actionBtnStyle} title="Download as XLS File">
              <FontAwesomeIcon icon={faDownload} />
            </button>
            <button onClick={handleShare} style={actionBtnStyle} title="Share via Web Share API or Link">
              <FontAwesomeIcon icon={faShareAlt} />
            </button>
          </div>
          <div ref={contentRef} style={{ maxHeight: "calc(90vh - 180px)", overflowY: "auto" }}>
            {content}
          </div>
        </div>
      </div>
    </>
  );
};

export default function ExammanagementChief() {
  // Styles
  const outerContainer = {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff",
    minHeight: "70vh",
    padding: "0",
    boxSizing: "border-box",
  };

  const innerContainer = {
    width: "100%",
    height: "auto",
    maxWidth: "1200px",
    display: "flex",
    gap: "20px",
    background: "#fff",
    borderRadius: "16px",
  };

  const headingStyle = {
    position: "absolute",
    top: "15px",
    left: "5px",
    fontSize: "16px",
    fontWeight: "800",
    color: "#2F2E2EFF",
    textAlign: "left",
    width: "auto",
    marginLeft: "2%"
  };

  const leftColumn = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const rightColumn = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  minHeight: "130px",
  boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
  fontSize: '12px',
  height: '100%',
  border: "2px solid #ccc",
  
  display: "flex",
  flexDirection: "column",
};
  const cardLarge = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    minHeight: "400px",
    boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
    border: "2px solid #ccc",
    height: '100%',
   minWidth: "700px",

    
  };
  const cardLargeBottom = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    minHeight: "205px",
    boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
    border: "2px solid #ccc",
    height: '70%',
  };

  const boxStyle = {
    flex: 1,
    padding: "8px",
    borderRight: "1px solid #ccc",
    borderRadius: "4px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    height: "140px",
    margin: "0 2px",
  };

  const iconStyle = {
    fontSize: "30px",
    color: "#4e4848ff",
    background: "transparent",
    borderRadius: "50%",
    border: "1px solid #0f0c0cff",
    padding: "5px",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "30px",
    height: "30px",
  };

  const btnStyle = {
    padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
    background: "transparent", color: "#3498db", fontSize: "11px", marginTop: "5px",
    width: "auto"
  };

  const btnStyleBottom = {
    padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
    background: "transparent", border: "1px solid #3498db", color: "#3498db", fontSize: "11px", marginTop: "5px",
    width: "auto"
  };

  // State
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
  const [examData, setExamData] = useState({
    qpStatus: { total_qp: 0, pending_approval: 0, classes_pending: [] },
    invigilatorStatus: { total_invigilators: 0, pending_classes: [], assignments: [] },
    seatingStatus: { total_assignments: 0, rooms_assigned: [] },
    scanPull: { total_scanned: 0, pending_scan: 0, report_card_pending: 0, pending_class_list: [] },
  });

  const [loadingExamData, setLoadingExamData] = useState(true);
  const [examError, setExamError] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("FA2");
  const [popup, setPopup] = useState({
    isOpen: false,
    title: "",
    content: null,
    downloadData: []
  });

  const [isBlurActive, setIsBlurActive] = useState(false);

  // Popup Handlers
  const handleOpenPopup = (type, data) => {
    let title = "";
    let content = null;
    let downloadData = [];

    if (type === "qp_status") {
      title = `QP Generation Status for ${selectedExamType}`;
      const safeData = data || { total_classes: 0, classes_with_qp: 0, pending_classes: 0, pending_class_list: [] };
      const safePendingList = safeData.pending_class_list.filter(item => item !== null);

      content = (
        <div style={{ fontFamily: "Arial, sans-serif", color: "#333" }}>
          <p><strong>Total Classes:</strong> {safeData.total_classes}</p>
          <p><strong>Classes with QP:</strong> {safeData.classes_with_qp}</p>
          <p><strong>Pending Classes:</strong> {safeData.pending_classes}</p>

          <h4 style={{ marginTop: "20px" }}>Pending Classes List:</h4>

          {safePendingList.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
              {safePendingList.map((cls, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#f8d7da",
                    color: "#842029",
                    padding: "8px 12px",
                    borderRadius: "20px",
                    fontWeight: "500",
                    fontSize: "14px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  Class {cls}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontStyle: "italic", color: "#555" }}>No classes pending.</p>
          )}
        </div>
      );
    }
    else if (type === "invigilator_status") {
      title = `Invigilator Status: Pending Classes for ${selectedExamType}`;
      const safeData = data || { total_invigilators: 0, pending_classes: [] };
      const safePendingList = safeData.pending_classes.filter(item => item !== null);

      content = (
        <div style={{ fontFamily: "Arial, sans-serif", color: "#333" }}>
          <p><strong>Total Invigilator Assignments:</strong> {safeData.total_invigilators}</p>

          <h4 style={{ marginTop: "20px" }}>Classes Pending Assignment:</h4>

          {safePendingList.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
              {safePendingList.map((cls, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#fff3cd",
                    color: "#664d03",
                    padding: "8px 12px",
                    borderRadius: "20px",
                    fontWeight: "500",
                    fontSize: "14px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  Class {cls}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontStyle: "italic", color: "#555", marginTop: "10px" }}>
              All classes assigned (or status not tracked).
            </p>
          )}
        </div>
      );
    }
    else if (type === "invigilator_assignments") {
      const safeData = Array.isArray(data) ? data : [];
      title = `Full Invigilator Assignment List (${safeData.length} Total Assignments)`;

      content = (
        <div style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          fontFamily: 'Arial, sans-serif',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          padding: '15px'
        }}>
          <div style={{ display: 'flex', fontWeight: '700', padding: '10px 5px', borderBottom: '2px solid #ddd', background: '#f9fafb' }}>
            <div style={{ flex: '0 0 5%', textAlign: 'center' }}>#</div>
            <div style={{ flex: '0 0 20%' }}>Class</div>
            <div style={{ flex: '0 0 40%' }}>Invigilator Name</div>
            <div style={{ flex: '0 0 35%' }}>Assigned Date</div>
          </div>

          {safeData.length > 0 ? (
            safeData.map((assignment, index) => (
              <div key={assignment.id || index} style={{
                display: 'flex',
                padding: '12px 5px',
                borderBottom: '1px solid #eee',
                alignItems: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ flex: '0 0 5%', textAlign: 'center' }}>{index + 1}</div>
                <div style={{ flex: '0 0 20%', fontWeight: '600' }}>Class {assignment.class_name}</div>
                <div style={{ flex: '0 0 40%' }}>{assignment.teacher_name}</div>
                <div style={{ flex: '0 0 35%' }}>
                  {assignment.assigned_date ? new Date(assignment.assigned_date).toLocaleString() : '-'}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#777',
              fontStyle: 'italic'
            }}>
              No invigilators have been assigned yet.
            </div>
          )}
        </div>
      );

      downloadData = safeData;
    }
    else if (type === "seating_status") {
      title = `Seating Order Status for ${selectedExamType}`;
      const safeData = data || { total_assignments: 0, rooms_assigned: [] };
      content = (
        <div>
          <p><strong>Total Seating Assignments (Rooms/Patterns):</strong> {safeData.total_assignments}</p>
          <h4>Assigned Rooms:</h4>
          <ul>
            {safeData.rooms_assigned.length > 0
              ? safeData.rooms_assigned.map((room, index) => <li key={index}>{room}</li>)
              : <li>No seating arrangements created yet.</li>}
          </ul>
        </div>
      );
    }
    else if (type === "scan_pull_pending") {
      const safePendingList = (data?.pending_class_list || []).filter(
        item => item !== null && (typeof item === 'object' || typeof item === 'string')
      );

      title = `Scan & Pull Pending Classes (${safePendingList.length} Total)`;

      content = (
        <div style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          fontFamily: 'Arial, sans-serif',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          padding: '15px'
        }}>
          <h4 style={{ marginBottom: '15px', fontWeight: 600, color: '#333' }}>Pending Classes:</h4>

          {safePendingList.length > 0 ? (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {safePendingList.map((item, index) => {
                const className = typeof item === 'string' ? item : item.class_name;
                const section = item?.section || '';
                return (
                  <div key={index} style={{
                    flex: '1 1 calc(50% - 10px)',
                    padding: '10px 12px',
                    background: '#f5f7fa',
                    borderRadius: '6px',
                    fontWeight: 500,
                    color: '#111',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s, background 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#e6f0ff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#f5f7fa';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <span>Class {className}</span>
                    {section && <span style={{
                      background: '#007bff',
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px'
                    }}>{section}</span>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#777',
              fontStyle: 'italic'
            }}>
              No classes are currently pending scan/pull.
            </div>
          )}
        </div>
      );

      downloadData = safePendingList;
    }

    setPopup({ isOpen: true, title, content, downloadData });
    setIsBlurActive(true);
  };

  const handleClosePopup = () => {
    setPopup({ isOpen: false, title: "", content: null, downloadData: [] });
    setIsBlurActive(false);
  };

  // Data Fetching
  useEffect(() => {
    const fetchExamData = async () => {
      if (!schoolCode) return;
      setLoadingExamData(true);
      setExamError("");

      try {
        const [qpRes, invigilatorRes, seatingRes] = await Promise.all([
          axios.get("https://cleezoclass.com:4000/api/qp-pending", { params: { schoolCode, examType: selectedExamType } }),
          axios.get("https://cleezoclass.com:4000/api/invigilator-status", { params: { schoolCode, examType: selectedExamType } }),
          axios.get("https://cleezoclass.com:4000/api/seating-status", { params: { schoolCode, examType: selectedExamType } })
        ]);

        const scanRes = await axios.get('https://cleezoclass.com:4000/api/pending-classes', {
          params: { schoolCode }
        });

        const pendingClasses = Array.isArray(scanRes.data) ? scanRes.data : [];
        const pendingCount = pendingClasses.length;

        const scanPullData = {
          total_scanned: 300,
          pending_scan: pendingCount,
          report_card_pending: pendingCount * 16,
          pending_class_list: pendingClasses,
        };

        const invigilatorData = invigilatorRes.data || {};
        const assignments = Array.isArray(invigilatorData.assignments) ? invigilatorData.assignments : [];
        const totalAssignmentsCount = assignments.length;

        setExamData({
          qpStatus: qpRes.data || { total_qp: 0, pending_approval: 0, classes_pending: [] },
          invigilatorStatus: {
            total_invigilators: totalAssignmentsCount,
            pending_classes: Array.isArray(invigilatorData.pending_classes) ? invigilatorData.pending_classes : [],
            assignments: assignments,
          },
          seatingStatus: seatingRes.data || { total_assignments: 0, rooms_assigned: [] },
          scanPull: scanPullData,
        });

      } catch (err) {
        console.error("Error fetching exam data:", err);
        setExamError("Failed to fetch exam dashboard data. Check backend and external Scan/Pull API.");
        setExamData({
          qpStatus: { total_qp: 0, pending_approval: 0, classes_pending: [] },
          invigilatorStatus: { total_invigilators: 0, pending_classes: [], assignments: [] },
          seatingStatus: { total_assignments: 0, rooms_assigned: [] },
          scanPull: { total_scanned: 0, pending_scan: 0, report_card_pending: 0, pending_class_list: [] },
        });

      } finally {
        setLoadingExamData(false);
      }
    };

    fetchExamData();
  }, [schoolCode, selectedExamType]);

  // Placeholder states
  const [records, setRecords] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"];

  return (
    <>
      {/* Main content with blur effect */}
      <div
        style={{
          ...outerContainer,
          filter: isBlurActive ? "blur(5px)" : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <h2 className="footprints">Exam Management</h2>
        <div style={innerContainer}>
          <div style={leftColumn}>
            <div style={cardLarge}>
              <div style={{ marginBottom: "15px", textAlign: "right" }}>
                <select
                  id="exam-type"
                  style={{
                    padding: "6px",
                    fontSize: "13px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    minWidth: "120px",
                  }}
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                >
                  <option value="FA1">FA1</option>
                  <option value="FA2">FA2</option>
                  <option value="SA1">SA1</option>
                  <option value="FA3">FA3</option>
                  <option value="FA4">FA4</option>
                  <option value="SA2">SA2</option>
                </select>
              </div>
              {loadingExamData && <p style={{ textAlign: "center" }}>Loading exam status...</p>}
              {examError && <p style={{ color: "black", textAlign: "center" }}>{examError}</p>}

              {!loadingExamData && (
                <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                  <div style={boxStyle}>
                    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "12px", marginLeft: '20px' }}>Question Paper Generation</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>{examData.qpStatus.classes_with_qp} QPs</p>
                   <button
                      data-guide="exam-btn-qp-view-status"
                      style={btnStyle}
                      onClick={() => handleOpenPopup("qp_status", examData.qpStatus)}
                    >
                      View Status
                    </button>
                  </div>
                  <div style={boxStyle}>
                    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <FontAwesomeIcon icon={faUserCheck} style={iconStyle} />
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "12px", marginLeft: '20px' }}>Invigilators</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>{examData.invigilatorStatus.total_invigilators} Assigned</p>
                    <button
                      data-guide="exam-btn-invigilators-view-list"
                      style={btnStyle}
                      onClick={() => handleOpenPopup("invigilator_assignments", examData.invigilatorStatus.assignments)}
                    >
                      View List
                    </button>
                  </div>
                  <div style={boxStyle}>
                    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <FontAwesomeIcon icon={faTrophy} style={iconStyle} />
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "12px", marginLeft: '20px' }}>Seating Order</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>{examData.seatingStatus.total_assignments} Created</p>
                    <button
                      data-guide="exam-btn-seating-order-view-status"
                      style={btnStyle}
                      onClick={() => handleOpenPopup("seating_status", examData.seatingStatus)}
                    >
                      View Status
                    </button>
                  </div>
                </div>
              )}
 
              <div style={{ marginTop: "15px", borderTop: "1px solid #ccc" }}>
                <h2 style={{ textAlign: "left", fontSize: "12px", margin: "10px", color: examData?.qpStatus?.pending_approval > 0 ? "black" : "black" }}>
                  <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: "5px", fontSize: "12px" }} />
                  Question paper generation  pending classes{(examData?.qpStatus?.pending_class_list ?? []).length > 0 ? (examData.qpStatus.pending_class_list ?? []).join(", ") : "No classes pending"} Generated: {examData?.qpStatus?.classes_with_qp ?? 0}
                </h2>
                <h2 style={{ textAlign: "left", fontSize: "12px", margin: "10px", color: examData.invigilatorStatus.pending_classes?.length > 0 ? "black" : "black" }}>
                  <FontAwesomeIcon icon={faAward} style={{ marginRight: "5px", fontSize: "12px" }} />
                  Invigilator assigned, class {examData.invigilatorStatus.pending_classes?.join(", ") || " "} not assigned
                </h2>
              </div>
            </div>
                        <div style={cardLargeBottom}>
              <div style={{ flex: "0 0 100%", borderRadius: "8px", padding: "15px", background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                  <div style={{ ...boxStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <FontAwesomeIcon icon={faUserClock} style={iconStyle} />
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "16px", marginLeft: '20px' }}>Scan & Pull – Total</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "5px 0" }}>{examData.scanPull.pending_scan}</p>
     <button
                      data-guide="exam-btn-scanpull-total-view-list"
                      style={{ ...btnStyleBottom }}
                      onClick={() => handleOpenPopup("scan_pull_pending", examData.scanPull)}
                    >
                      View List
                    </button>                  </div>
                  <div style={{ ...boxStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <FontAwesomeIcon icon={faUserTimes} style={iconStyle} />
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "16px", marginLeft: '20px' }}>Scan & Pull – Pending</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "5px 0" }}>{examData.scanPull.pending_scan}</p>
                    <button
                      data-guide="exam-btn-scanpull-pending-view-list"
                      style={{ ...btnStyleBottom }}
                      onClick={() => handleOpenPopup("scan_pull_pending", examData.scanPull)}
                    >
                      View List
                    </button>
                  </div>
                  <div style={{ ...boxStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <FontAwesomeIcon icon={faMoneyCheckAlt} style={iconStyle} />
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "16px", marginLeft: '20px' }}>Report Card pending</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "5px 0" }}>0</p>
                    <button style={{ ...btnStyleBottom }}>View List</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={rightColumn}>
            <div style={{ ...card, marginTop: '-20px' }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Scan & Pull – Pending</h3>
              <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>
                <span style={{ fontSize: "16px", textAlign: 'center' }}>
                  {examData.scanPull.pending_scan}
                </span> Classes
              </h3>
              <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>
                {Math.ceil(examData.scanPull.pending_scan * 5)} Subjects
              </h3>
              <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                <button
                  data-guide="exam-btn-right-scanpull-view-list"
                  style={{ ...btnStyleBottom }}
                  onClick={() => handleOpenPopup("scan_pull_pending", examData.scanPull)}
                >
                  View List
                </button>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Invigilator Pending</h3>
              <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>{examData.invigilatorStatus.pending_classes?.length || 0} Classes</h3>
              <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>{selectedExamType}</h3>
              <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                <button
                  data-guide="exam-btn-right-invigilator-pending-view-list"
                  style={{ ...btnStyleBottom, width: "150px" }}
                  onClick={() => handleOpenPopup("invigilator_status", examData.invigilatorStatus)}
                >
                  View Pending List
                </button>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Question paper generation</h3>
              <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>{selectedExamType}</h3>
              <h3 style={{ fontSize: "16px", margin: "0 0 5px 0", color: "black" }}>{examData.qpStatus.pending_approval} pending approval</h3>
         
              <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                <button
                  data-guide="exam-btn-right-qp-approve-all"
                  style={{ ...btnStyleBottom, width: "150px" }}
                >
                  Approve All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup outside the blurred container */}
      {popup.isOpen && (
        <Popup
          title={popup.title}
          content={popup.content}
          onClose={handleClosePopup}
          downloadData={popup.downloadData}
        />
      )}
    </>
  );
}
