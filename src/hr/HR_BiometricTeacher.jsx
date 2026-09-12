import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faTimes, faBell, faAngleRight, faSearch } from "@fortawesome/free-solid-svg-icons";
import './HR_BiometricTeacher.css';
import { FaBell, FaCog, FaFingerprint, FaMapMarkerAlt, FaMoneyBillWave, FaUserPlus } from "react-icons/fa";

const BiometricTeacher = () => {
  const navigate = useNavigate();
  // const [name, setName] = useState("");
  const [popup, setPopup] = useState(null);
  const [rightPopup, setRightPopup] = useState(null);

  // State for data
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [editedLogs, setEditedLogs] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [recentHrActions, setRecentHrActions] = useState(() => {
    try {
      const saved = localStorage.getItem("hrBiometricTeacherRecentActions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
  const name = localStorage.getItem("name")

  const logHrAction = (title, detail) => {
    const entry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title,
      detail,
      createdAt: new Date().toISOString(),
    };
    setRecentHrActions((prev) => [entry, ...prev].slice(0, 20));
  };

  useEffect(() => {
    localStorage.setItem("hrBiometricTeacherRecentActions", JSON.stringify(recentHrActions));
  }, [recentHrActions]);

  // useEffect(() => {
  //   const fetchUserName = async () => {
  //     const username = localStorage.getItem("name");
  //     if (!username) return;
  //     try {
  //       const response = await fetch(
  //         `https://cleezoclass.com:4000/getUserName?username=${encodeURIComponent(username)}`
  //       );
  //       if (!response.ok) return;
  //       const contentType = response.headers.get("content-type") || "";
  //       if (!contentType.includes("application/json")) return;
  //       const data = await response.json();
  //       if (data && typeof data.name === "string") setName(data.name);
  //     } catch (err) {
  //       console.error("Error fetching user name:", err);
  //     }
  //   };
  //   fetchUserName();
  // }, []);

  const fetchDeletedUsers = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/api/deleted-teachers", {
        params: { schoolCode },
      });
      setDeletedUsers(res.data);
    } catch (error) {
      console.error("Error fetching deleted users:", error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/teacher-leave-requests-list", {
        params: { schoolCode },
      });
      setLeaveRequests(res.data);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    }
  };

  const refreshHrActionsData = async (withLog = false) => {
    const storedLogs = JSON.parse(localStorage.getItem("editedAdmissionsLogs")) || [];
    setEditedLogs(storedLogs);
    await Promise.all([fetchDeletedUsers(), fetchLeaveRequests()]);
    if (withLog) {
      logHrAction("Actions refreshed", "Deleted teachers, leave requests, and edit logs reloaded");
    }
  };

  useEffect(() => {
    refreshHrActionsData(false);
  }, [schoolCode]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // Group data
  const groupedDeletedUsers = deletedUsers.reduce((acc, user) => {
    const key = `deleted-${user.class_name}-${user.section}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {});

  const groupedLeaveRequests = leaveRequests.reduce((acc, req) => {
    const key = "leave-all";
    if (!acc[key]) acc[key] = [];
    acc[key].push(req);
    return acc;
  }, {});

  // Toggle row to show popup
  const toggleRow = (key) => {
    const [prefix, className, section] = key.split("-");
    if (prefix === "deleted") {
      const users = groupedDeletedUsers[key];
      setRightPopup({
        title: `Exits - Class: ${className} | Section: ${section}`,
        content: (
          <div className="biometric-table-wrapper">
            <table className="biometric-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>User Type</th>
                  <th>Father Name</th>
                  <th>Phone No</th>
                  <th>Aadhar No</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f1f5f9" }}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.user_type}</td>
                    <td>{user.father_name}</td>
                    <td>{user.phone_no}</td>
                    <td>{user.aadhar_no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      });
      logHrAction("Viewed exits", `Class ${className}-${section} | ${users.length} entries`);
    } else if (prefix === "edit") {
      const logId = key.replace("edit-", "");
      const log = editedLogs.find((l) => l.id === logId);
      setRightPopup({
        title: `Enrollment Edit - ${log.student_name}`,
        content: (
          <div className="biometric-table-wrapper">
            <table className="biometric-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Student Name</th>
                  <th>Fields Edited</th>
                  <th>Edited At</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "#ffffff" }}>
                  <td>{log.class}</td>
                  <td>{log.student_name}</td>
                  <td>{log.fieldsEdited.join(", ")}</td>
                  <td>{log.editedAt}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      });
      logHrAction("Viewed enrollment edit", `${log.student_name} | Class ${log.class}`);
    } else if (prefix === "leave") {
      const requests = groupedLeaveRequests[key];
      setRightPopup({
        title: "Teacher Leave Requests",
        content: (
          <div className="biometric-table-wrapper">
            <table className="biometric-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Teacher Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ backgroundColor: "#ffffff" }}>
                    <td>{req.id}</td>
                    <td>{req.teacher_name || req.student_name || "-"}</td>
                    <td>{formatDate(req.leave_start_date || req.start_date)}</td>
                    <td>{formatDate(req.leave_end_date || req.end_date)}</td>
                    <td>{req.reason}</td>
                    <td>{formatDate(req.submitted_at || req.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      });
      logHrAction("Viewed teacher leave requests", `${requests.length} requests`);
    }
  };

  // Data for cards
  const enrollmentActions = [
    { label: "New Enrollment", icon: true },
    { label: "Edit Previous Enrollment" },
    { label: "Delete Enrollment" },
    { label: "Exits" },
  ];
  const biometricsActions = [
    { label: "New Biometrics", icon: true },
    { label: "Edit Previous" },
    { label: "Delete Biometrics" },
  ];
  const trackingActions = [
    { label: "List of Irregulars" },
    { label: "List of Late Comers" },
    { label: "List of Leave Requests" },
  ];
  const payrollActions = [
    { label: "BreakUp Entry" },
    { label: "Issue Certificates" },
    { label: "edit-payroll-" },
    { label: "Delete Payroll" },
  ];
  const allActions = [
    { label: "Generate Report" },
    { label: "Export Data" },
    { label: "Settings" },
    { label: "Attendance Summary" },
    { label: "Payroll Audit" },
    { label: "Compliance Check" },
  ];

  const sectionColors = ["#D4C7B0", "#868C8F", "#705B56", "#D9EEF8", "#888888"];

  const handleActionClick = (label, prefix) => {
    const route = `/${prefix}/${label.toLowerCase().replace(/\s+/g, "-")}`;
    logHrAction("Action opened", label);
    setPopup({ title: label, route });
  };

  const renderActionItems = (actions, routePrefix, color) =>
    actions.map((action, idx) => (
      <div
        key={idx}
        className="biometric-action-item"
        onClick={() => handleActionClick(action.label, routePrefix)}
      >
        <div className="biometric-action-dot" style={{ backgroundColor: color }}></div>
        {action.icon ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="biometric-action-icon-box">+</div>
            <span className="biometric-action-text">{action.label}</span>
          </div>
        ) : (
          <div className="biometric-action-text">{action.label}</div>
        )}
      </div>
    ));

  return (
   <div className="biometric-teacher-container">
  <div className="biometric-grid">

    {/* ══════════════════════════════════════════════════════════
        ROW 1: Welcome+Recent (left half) | Stats+Actions (right half)
        ═══════════════════════════════════════════════════════════ */}
    <div className="biometric-row1-left">
      <div className="hr-welcome-block">
        <h2>Hi, {name || "HR Manager"}!</h2>
        <p>Track Teacher Records & Payroll</p>
        <p>Monitor Biometrics & HR Activities</p>
      </div>

      <div className="biometric-card biometric-activity-card">
        <div className="biometric-card-header">
          <h3 className="biometric-section-title">Recent Activity</h3>
        </div>
        <div className="biometric-card-body">
          {recentHrActions.length > 0 ? (
            recentHrActions.slice(0, 6).map((a) => (
              <div key={a.id} className="biometric-recent-card">
                <div className="biometric-recent-title">{a.title}</div>
                <div className="biometric-recent-detail">{a.detail}</div>
                <div className="biometric-recent-time">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="biometric-empty-state">No recent activity</div>
          )}
        </div>
      </div>
    </div>

    <div className="biometric-card biometric-combined-card">
      <div className="biometric-combined-section">
        <div className="biometric-card-header">
          <h3 className="biometric-section-title">Quick Stats</h3>
        </div>
        <div className="biometric-card-body">
          <div className="biometric-summary-grid">
            <div className="biometric-summary-card">
              <div className="biometric-summary-label">Exits Pending</div>
              <div className="biometric-summary-value">{deletedUsers.length}</div>
            </div>
            <div className="biometric-summary-card">
              <div className="biometric-summary-label">Edits Logged</div>
              <div className="biometric-summary-value">{editedLogs.length}</div>
            </div>
            <div className="biometric-summary-card">
              <div className="biometric-summary-label">Leave Requests</div>
              <div className="biometric-summary-value">{leaveRequests.length}</div>
            </div>
            <div className="biometric-summary-card">
              <div className="biometric-summary-label">Recent Actions</div>
              <div className="biometric-summary-value">{recentHrActions.length}</div>
            </div>
          </div>
          <div className="biometric-btn-row">
            <button className="biometric-btn-outline" onClick={() => refreshHrActionsData(true)}>
               Refresh
            </button>
            <button className="biometric-btn-outline" onClick={() => setRecentHrActions([])}>
               Clear
            </button>
          </div>
        </div>
      </div>

      <div className="biometric-section-divider-vertical"></div>

      <div className="biometric-combined-section">
        <div className="biometric-card-header">
          <h3 className="biometric-section-title">Quick Actions</h3>
        </div>
        <div className="biometric-card-body">
          <div className="biometric-chip-row">
            {allActions.map((a) => (
              <button
                key={a.label}
                className="biometric-chip"
                onClick={() => handleActionClick(a.label, "Development/actions")}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="biometric-btn-row">
            <button className="biometric-btn-outline" onClick={() => setRightPopup(null)}>
              Close Popups
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ═══════════════════════════════════════════════════════════
        ROW 2: Recruitments | Biometrics | Tracking (3 equal)
        ═══════════════════════════════════════════════════════════ */}
    <div className="biometric-card biometric-row2-card">
      <div className="biometric-card-header">
        <FaUserPlus />
        <h3 className="biometric-section-title">Recruitments</h3>
      </div>
      <div className="biometric-card-body">
        {renderActionItems(enrollmentActions, "Development/teacher", "#000")}
      </div>
    </div>

    <div className="biometric-card biometric-row2-card">
      <div className="biometric-card-header">
        <FaFingerprint />
        <h3 className="biometric-section-title">Biometrics</h3>
      </div>
      <div className="biometric-card-body">
        {renderActionItems(biometricsActions, "Development/biometrics", "#000")}
      </div>
    </div>

    <div className="biometric-card biometric-row2-card">
      <div className="biometric-card-header">
        <FaMapMarkerAlt />
        <h3 className="biometric-section-title">Tracking</h3>
      </div>
      <div className="biometric-card-body">
        {renderActionItems(trackingActions, "Development/tracking", "#000")}
      </div>
    </div>

    {/* ═══════════════════════════════════════════════════════════
        ROW 3: Payroll | Notifications | System Info (3 equal)
        ═══════════════════════════════════════════════════════════ */}
    <div className="biometric-card biometric-row3-card">
      <div className="biometric-card-header">
        <FaMoneyBillWave />
        <h3 className="biometric-section-title">Payroll</h3>
      </div>
      <div className="biometric-card-body">
        {renderActionItems(payrollActions, "Development/payroll", "#000")}
      </div>
    </div>

    <div className="biometric-card biometric-row3-card">
      <div className="biometric-card-header">
        <FaBell />
        <h3 className="biometric-section-title">Leave's & Notifications</h3>
      </div>
      <div className="biometric-card-body">
        {Object.keys(groupedDeletedUsers).length === 0 && editedLogs.length === 0 && Object.keys(groupedLeaveRequests).length === 0 ? (
          <div className="biometric-empty-state">No pending notifications</div>
        ) : (
          <>
            {Object.keys(groupedDeletedUsers).map((key) => {
              const users = groupedDeletedUsers[key];
              const [_, className, section] = key.split("-");
              return (
                <div key={key} className="biometric-notification-row" onClick={() => toggleRow(key)}>
                  <FontAwesomeIcon icon={faArrowRight} style={{ color: "#f9b1b8" }} />
                  <div>
                    <div>Exits - {className}/{section}</div>
                    <div className="biometric-notification-info">Pending: {users.length}</div>
                  </div>
                </div>
              );
            })}
   {Object.keys(groupedLeaveRequests).map((key) => {
              const requests = groupedLeaveRequests[key];
              return (
                <div key={key} className="biometric-notification-row" onClick={() => toggleRow(key)}>
                  <FontAwesomeIcon icon={faArrowRight} style={{ color: "#10b981" }} />
                  <div>
                    <div>Leave Requests</div>
                    <div className="biometric-notification-info">Pending: {requests.length}</div>
                  </div>
                </div>
              );name
            })}
            {editedLogs.slice(0, 3).map((log) => (
              <div
                key={`edit-${log.id}`}
                className="biometric-notification-row"
                onClick={() => toggleRow(`edit-${log.id}`)}
              >
                <FontAwesomeIcon icon={faArrowRight} style={{ color: "#f59e0b" }} />
                <div>
                  <div>Edit - {log.student_name}</div>
                  <div className="biometric-notification-info">
                    Class: {log.class} | {log.fieldsEdited.join(", ")}
                  </div>
                </div>
              </div>
            ))}

         
          </>
        )}
      </div>
    </div>

    <div className="biometric-card biometric-row3-card">
      <div className="biometric-card-header">
        <FaCog />
        <h3 className="biometric-section-title">System Info</h3>
      </div>
      <div className="biometric-card-body">
        <div className="biometric-summary-grid">
          <div className="biometric-summary-card">
            <div className="biometric-summary-label">School Code</div>
            <div className="biometric-summary-value" style={{ fontSize: "14px" }}>{schoolCode}</div>
          </div>
          <div className="biometric-summary-card">
            <div className="biometric-summary-label">User</div>
            <div className="biometric-summary-value" style={{ fontSize: "14px" }}>{name || "Admin"}</div>
          </div>
          <div className="biometric-summary-card">
            <div className="biometric-summary-label">Total Exits</div>
            <div className="biometric-summary-value">{Object.keys(groupedDeletedUsers).length}</div>
          </div>
          <div className="biometric-summary-card">
            <div className="biometric-summary-label">Today</div>
            <div className="biometric-summary-value" style={{ fontSize: "12px" }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="biometric-btn-row" style={{ marginTop: "auto" }}>
          <button
            className="biometric-btn-outline"
            onClick={() => handleActionClick("Settings", "Development/actions")}
            style={{ width: "100%" }}
          >
            ⚙️ System Settings
          </button>
        </div>
      </div>
    </div>

  </div>

  {/* Popups */}
  {popup && (
    <div className="biometric-popup-overlay" onClick={() => setPopup(null)}>
      <div className="biometric-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="biometric-popup-close-btn" onClick={() => setPopup(null)}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <iframe src={popup.route} title={popup.title} style={{ width: "100%", height: "100%", border: "none" }} />
      </div>
    </div>
  )}

  {rightPopup && (
    <div className="biometric-popup-overlay" onClick={() => setRightPopup(null)}>
      <div className="biometric-popup-content" onClick={(e) => e.stopPropagation()} style={{ padding: "20px", overflow: "auto" }}>
        <button className="biometric-popup-close-btn" onClick={() => setRightPopup(null)}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h3 style={{ marginTop: "0", textAlign: "center", marginBottom: "20px", color: "#1f2937" }}>
          {rightPopup.title}
        </h3>
        {rightPopup.content}
      </div>
    </div>
  )}
</div>
  );
};

export default BiometricTeacher;