import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import './HR_Biometric.css'
import GlobalLoader from "../shared/GlobelLoading";
import { FaFingerprint, FaUserPlus, FaCalendarCheck, FaExclamationTriangle, FaTools } from "react-icons/fa";

const Biometric = () => {
  const navigate = useNavigate();
  // const [name, setName] = useState("");
  const [popup, setPopup] = useState(null);
  const [rightPopup, setRightPopup] = useState(null);

  // Data states
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [editedLogs, setEditedLogs] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [recentHrActions, setRecentHrActions] = useState(() => {
    try {
      const saved = localStorage.getItem("hrBiometricRecentActions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

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
    localStorage.setItem(
      "hrBiometricRecentActions",
      JSON.stringify(recentHrActions)
    );
  }, [recentHrActions]);

  // Fetch user name
  // useEffect(() => {
  //   const fetchUserName = async () => {
  //     const username = localStorage.getItem("name");
  //     if (!username) return;
  //     try {
  //       const response = await fetch(
  //         `https://cleezoclass.com:4000/getUserName?username=${encodeURIComponent(
  //           username
  //         )}`
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
const name = localStorage.getItem("name")
  const fetchDeletedUsers = async () => {
    try {
      const res = await axios.get(
        "https://cleezoclass.com:4000/api/deleted-students",
        { params: { schoolCode } }
      );
      setDeletedUsers(res.data);
    } catch (error) {
      console.error("Error fetching deleted users:", error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await axios.get(
        "https://cleezoclass.com:4000/leave-requests-list",
        { params: { schoolCode } }
      );
      setLeaveRequests(res.data);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    }
  };

  const refreshHrActionsData = async (withLog = false) => {
    const storedLogs =
      JSON.parse(localStorage.getItem("editedAdmissionsLogs")) || [];
    setEditedLogs(storedLogs);
    await Promise.all([fetchDeletedUsers(), fetchLeaveRequests()]);
    if (withLog) {
      logHrAction(
        "Actions refreshed",
        "Deleted users, leave requests, and edit logs reloaded"
      );
    }
  };

  useEffect(() => {
    refreshHrActionsData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolCode]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString();
  };

  const toggleRow = (key) => {
    const [prefix, className, section] = key.split("-");
    if (prefix === "deleted") {
      const users = groupedDeletedUsers[key];
      setRightPopup({
        title: `Exits - Class: ${className} | Section: ${section}`,
        content: (
          <div className="bio-table-wrapper">
            <table className="bio-table">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>User Type</th>
                  <th>Father Name</th><th>Phone No</th><th>Aadhar No</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} className={idx % 2 === 0 ? "bio-row-even" : "bio-row-odd"}>
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
          <div className="bio-table-wrapper">
            <table className="bio-table">
              <thead>
                <tr>
                  <th>Class</th><th>Student Name</th>
                  <th>Fields Edited</th><th>Edited At</th>
                </tr>
              </thead>
              <tbody>
                <tr>
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
      const [_, leaveClassName, leaveSection] = key.split("-");
      setRightPopup({
        title: `Leave Requests - Class: ${leaveClassName} | Section: ${leaveSection}`,
        content: (
          <div className="bio-table-wrapper">
            <table className="bio-table">
              <thead>
                <tr>
                  <th>ID</th><th>Student Name</th><th>Start Date</th>
                  <th>End Date</th><th>Reason</th><th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.student_name}</td>
                    <td>{formatDate(req.start_date)}</td>
                    <td>{formatDate(req.end_date)}</td>
                    <td>{req.reason}</td>
                    <td>{formatDate(req.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      });
      logHrAction("Viewed leave requests", `Class ${leaveClassName}-${leaveSection} | ${requests.length} requests`);
    }
  };

  // Group data
  const groupedDeletedUsers = deletedUsers.reduce((acc, user) => {
    const key = `deleted-${user.class_name}-${user.section}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {});

  const groupedLeaveRequests = leaveRequests.reduce((acc, req) => {
    const key = `leave-${req.class_name}-${req.section}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(req);
    return acc;
  }, {});

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
  const attendanceActions = [
    { label: "List of Irregulars" },
    { label: "List of Late Comers" },
    { label: "List of Leave Requests" },
  ];

  const complaintTypes = ["Type A", "Type B", "Type C"];
  const submitToOptions = ["Admin", "Manager", "Principal"];

  const sectionColors = ["#D4C7B0", "#868C8F", "#705B56", "#D9EEF8", "#888888"];

  const handleActionClick = (label, prefix) => {
    const route = `/${prefix}/${label.toLowerCase().replace(/\s+/g, "-")}`;
    logHrAction("Action opened", label);
    setPopup({ title: label, route });
  };

  const renderActionItems = (actions, routePrefix) =>
    actions.map((action, idx) => (
      <div
        key={idx}
        className="bio-action-item"
        onClick={() => handleActionClick(action.label, routePrefix)}
      >
        {action.icon ? (
          <div className="bio-action-with-plus">
            <div className="bio-plus-icon">+</div>
            <span>{action.label}</span>
          </div>
        ) : (
          <span className="bio-action-text">{action.label}</span>
        )}
      </div>
    ));

  return (
<div className="bio-page">
  

  <div className="bio-row bio-row-1">
    <div className="hr-welcome-block">
      <h2>Hi, {name || "HR Manager"}!</h2>
      <p>Manage Student Enrollments & Attendance</p>
      <p>Track Teacher Records & Payroll</p>
      <p>Monitor Biometrics & HR Activities</p>
    </div>

    <div className="bio-card bio-biometrics">
      <div className="bio-card-header">
        <FaFingerprint/>
        <h3 className="bio-section-title">Biometrics</h3>
      </div>
      <div className="bio-card-body">
        {renderActionItems(biometricsActions, "CRM/biometrics")}
      </div>
    </div>

    <div className="bio-card bio-enrollments">
      <div className="bio-card-header">
        <FaUserPlus className="bio-header-icon" />
        <h3 className="bio-section-title">Enrollments</h3>
      </div>
      <div className="bio-card-body">
        {renderActionItems(enrollmentActions, "CRM/enrollments")}
      </div>
    </div>
  </div>


  <div className="bio-row bio-row-2">
    <div className="bio-row-2-left">
      <div className="bio-card bio-attendance">
        <div className="bio-card-header">
          <FaCalendarCheck className="bio-header-icon" />
          <h3 className="bio-section-title">Attendance</h3>
        </div>
        <div className="bio-card-body">
          {renderActionItems(attendanceActions, "CRM/attendance")}
        </div>
      </div>

      <div className="bio-card bio-complaints">
        <div className="bio-card-header">
          <FaExclamationTriangle className="bio-header-icon" />
          <h3 className="bio-section-title">Complaints</h3>
        </div>
   <div className="bio-card-body">
  <div className="bio-complaint-form">
    <select className="bio-dropdown">
      {complaintTypes.map((type, idx) => (
        <option key={idx}>{type}</option>
      ))}
    </select>

    <select className="bio-dropdown">
      {submitToOptions.map((option, idx) => (
        <option key={idx}>{option}</option>
      ))}
    </select>
  </div>

  <button className="bio-btn-ok">OK</button>
</div>
      </div>
    </div>

    <div className="bio-actions-panel">
      <div className="bio-card-header">
        <FaTools className="bio-header-icon" />
        <h3 className="bio-section-title">Actions</h3>
      </div>

      {/* Quick Stats */}
      <div className="bio-stats-grid">
        <div className="bio-stat-card">
          <div className="bio-stat-label">Exits Pending</div>
          <div className="bio-stat-value">{deletedUsers.length}</div>
        </div>
        <div className="bio-stat-card">
          <div className="bio-stat-label">Edits Logged</div>
          <div className="bio-stat-value">{editedLogs.length}</div>
        </div>
        <div className="bio-stat-card">
          <div className="bio-stat-label">Leave Requests</div>
          <div className="bio-stat-value">{leaveRequests.length}</div>
        </div>
        <div className="bio-stat-card">
          <div className="bio-stat-label">Recent Actions</div>
          <div className="bio-stat-value">{recentHrActions.length}</div>
        </div>
      </div>

     
      <div className="bio-btn-row">
        <button className="bio-btn-outline" onClick={() => refreshHrActionsData(true)}>
          Refresh
        </button>
        <button className="bio-btn-outline" onClick={() => {
          setRightPopup(null);
          logHrAction("Popup cleared", "Closed all action popups");
        }}>
          Close Popups
        </button>
        <button className="bio-btn-outline" onClick={() => setRecentHrActions([])}>
          Clear History
        </button>
      </div>

   
      {Object.keys(groupedDeletedUsers).length > 0 &&
        Object.keys(groupedDeletedUsers).map((key) => {
          const users = groupedDeletedUsers[key];
          const [_, className, section] = key.split("-");
          return (
            <div key={key} className="bio-row-card" onClick={() => toggleRow(key)}>
              <div className="bio-row-title">
                <FontAwesomeIcon icon={faArrowRight} />
                Exits
              </div>
              <div className="bio-row-detail">
                Class: {className} | Section: {section} | Pending: {users.length}
              </div>
            </div>
          );
        })}

      {editedLogs.length > 0 &&
        editedLogs.map((log) => (
          <div key={`edit-${log.id}`} className="bio-row-card" onClick={() => toggleRow(`edit-${log.id}`)}>
            <div className="bio-row-title">
              <FontAwesomeIcon icon={faArrowRight} />
              Enrollment Edit
            </div>
            <div className="bio-row-detail">
              Class: {log.class} | {log.student_name} ({log.fieldsEdited.join(", ")}) | {log.editedAt}
            </div>
          </div>
        ))}

      {/* Leave Requests */}
      {Object.keys(groupedLeaveRequests).length > 0 &&
        Object.keys(groupedLeaveRequests).map((key) => {
          const requests = groupedLeaveRequests[key];
          const [_, className, section] = key.split("-");
          return (
            <div key={key} className="bio-row-card" onClick={() => toggleRow(key)}>
              <div className="bio-row-title">
                <FontAwesomeIcon icon={faArrowRight} />
                Leave Requests
              </div>
              <div className="bio-row-detail">
                Class: {className} | Section: {section} | Pending: {requests.length}
              </div>
            </div>
          );
        })}
    </div>
  </div>

  {/* Popups */}
  {rightPopup && (
    <div className="bio-overlay" onClick={() => setRightPopup(null)}>
      <div className="bio-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="bio-popup-close" onClick={() => setRightPopup(null)}>
          Close
        </button>
        <h3 className="bio-popup-title">{rightPopup.title}</h3>
        {rightPopup.content}
      </div>
    </div>
  )}

  {popup && (
    <div className="bio-overlay" onClick={() => setPopup(null)}>
      <div className="bio-iframe-popup" onClick={(e) => e.stopPropagation()}>
        <iframe src={popup.route} title={popup.title} className="bio-iframe" />
      </div>
    </div>
  )}
</div>
  );
};

export default Biometric;