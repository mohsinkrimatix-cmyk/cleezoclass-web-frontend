import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowRight, 
  faCalendarPlus, 
  faCalendarCheck, 
  faHandshake, 
  faTools,
  faBolt
} from "@fortawesome/free-solid-svg-icons";
import './HR_EventsMettings.css';
import { FaBolt, FaCalendarCheck, FaCalendarPlus, FaHandshake, FaHandshakeAltSlash, FaTools } from "react-icons/fa";

const EventAndMeetings = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [popup, setPopup] = useState(null);
  const [rightPopup, setRightPopup] = useState(null);
  
  // Event states
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusEventId, setStatusEventId] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Actions data
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [editedLogs, setEditedLogs] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

  // Fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      const username = localStorage.getItem("username");
      if (!username) return;
      try {
        const response = await fetch(
          `https://cleezoclass.com:4000/getUserName?username=${encodeURIComponent(username)}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data && typeof data.name === "string") setName(data.name);
      } catch (err) {
        console.error("Error fetching user name:", err);
      }
    };
    fetchUserName();
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('https://cleezoclass.com:4000/api/events', {
          params: { schoolCode },
        });
        setEvents(response.data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [schoolCode]);

  // Fetch actions data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deletedRes, leaveRes] = await Promise.all([
          axios.get("https://cleezoclass.com:4000/api/deleted-teachers", { params: { schoolCode } }),
          axios.get("https://cleezoclass.com:4000/leave-requests-list", { params: { schoolCode } }),
        ]);
        setDeletedUsers(deletedRes.data);
        setLeaveRequests(leaveRes.data);
        setEditedLogs(JSON.parse(localStorage.getItem("editedAdmissionsLogs")) || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [schoolCode]);

  // Handlers
  const handleEventChange = (e) => {
    const id = Number(e.target.value);
    const event = events.find((ev) => ev.id === id);
    setSelectedEvent(event);
    setEventDetails(null);
  };

  const handleGenerateManual = () => {
    if (!selectedEvent || !title) {
      alert('Please select an event and enter a title.');
      return;
    }
    setEventDetails({ ...selectedEvent, title, description });
    alert(`Manual Event Generated:\nEvent: ${selectedEvent.event_name}\nTitle: ${title}`);
  };

  const handleGenerateAutomatic = () => {
    if (!selectedEvent) {
      alert('Please select an event.');
      return;
    }
    setEventDetails(selectedEvent);
    alert(`Automatic Event Generated:\nEvent: ${selectedEvent.event_name}`);
  };

  const handleUpdateEventStatus = () => {
    console.log("Event: ", statusEventId);
    console.log("Status: ", eventStatus);
    alert(`Status updated for event ${statusEventId} to ${eventStatus}`);
  };

  const handleImageDownload = (imageData) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${imageData}`;
    link.download = `${eventDetails.event_name}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    } else if (prefix === "leave") {
      const requests = groupedLeaveRequests[key];
      setRightPopup({
        title: `Leave Requests - Class: ${className} | Section: ${section}`,
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

  // Meeting actions
  const meetingActions = [
    { label: "New Meetings", icon: true },
    { label: "Edit Meetings" },
    { label: "Delete Meetings" },
  ];

  const renderActionItems = (actions, routePrefix) =>
    actions.map((action, idx) => (
      <div
        key={idx}
        className="bio-action-item"
        onClick={() => {
          const route = `/${routePrefix}/${action.label.toLowerCase().replace(/\s+/g, "-")}`;
          setPopup({ title: action.label, route });
        }}
      >
        {action.icon ? (
          <div className="bio-action-with-plus">
            <div className="bio-plus-icon">+</div>
            <span className="bio-action-text">{action.label}</span>
          </div>
        ) : (
          <span className="bio-action-text">{action.label}</span>
        )}
      </div>
    ));

  return (
    <div className="bio-page">
      
      {/* ══════════ ROW 1: Welcome + Manual Event + Automatic Event ══════════ */}
      <div className="bio-row bio-row-1">
        <div className="hr-welcome-block">
          <h2>Hi, {name || "HR Manager"}!</h2>
          <p>Manage Events & Meetings</p>
          <p>Track Event Status & Notifications</p>
          <p>Coordinate Team Activities</p>
        </div>

        {/* Manual Event Entry */}
        <div className="bio-card bio-manual-event">
          <div className="bio-card-header">
            <div className="bio-header-icon">
              <FaCalendarPlus/>
            </div>
            <h3 className="bio-section-title">Manual Event Entry</h3>
          </div>
          <div className="bio-card-body">
            <div className="bio-form-group">
              <select 
                className="bio-dropdown"
                value={selectedEvent?.id || ''} 
                onChange={handleEventChange}
              >
                <option value="">Select Event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.event_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="bio-input"
                maxLength={150}
                placeholder="Enter title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="bio-textarea"
                maxLength={150}
                placeholder="Write description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button className="bio-btn-ok" onClick={handleGenerateManual}>
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Automatic Event Entry */}
        <div className="bio-card bio-auto-event">
          <div className="bio-card-header">
            <div className="bio-header-icon">
              <FaBolt />
            </div>
            <h3 className="bio-section-title">Automatic Event Entry</h3>
          </div>
          <div className="bio-card-body">
            <div className="bio-form-group">
              <select 
                className="bio-dropdown"
                value={selectedEvent?.id || ''}
                onChange={handleEventChange}
              >
                <option value="">Select Event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.event_name}
                  </option>
                ))}
              </select>
              <button className="bio-btn-ok" onClick={handleGenerateAutomatic}>
                Generate
              </button>
            </div>

            {/* Event Details Preview */}
            {eventDetails && (
              <div className="bio-event-preview">
                <h4>{eventDetails.event_name}</h4>
                {eventDetails.title && <p><strong>Title:</strong> {eventDetails.title}</p>}
                {eventDetails.description && <p>{eventDetails.description}</p>}
                {eventDetails.image && (
                  <button 
                    className="bio-btn-outline"
                    onClick={() => handleImageDownload(eventDetails.image)}
                  >
                    Download Image
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ ROW 2: Event Status + Meeting Status | Actions ══════════ */}
      <div className="bio-row bio-row-2">
        <div className="bio-row-2-left">
          {/* Event Status */}
          <div className="bio-card bio-event-status">
            <div className="bio-card-header">
              <div className="bio-header-icon">
         <FaCalendarCheck/>
              </div>
              <h3 className="bio-section-title">Event Status</h3>
            </div>
            <div className="bio-card-body">
              <div className="bio-form-group">
                <select
                  className="bio-dropdown"
                  value={statusEventId}
                  onChange={(e) => setStatusEventId(e.target.value)}
                >
                  <option value="">Select Event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.event_name}
                    </option>
                  ))}
                </select>
                <select
                  className="bio-dropdown"
                  value={eventStatus}
                  onChange={(e) => setEventStatus(e.target.value)}
                >
                  <option value="">Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
        
              </div>
                      <button className="bio-btn-ok" onClick={handleUpdateEventStatus}>
                  Update
                </button>
            </div>
          </div>

          {/* Meeting Status */}
{/* Meeting Status */}
<div className="bio-card bio-meeting-status">
  <div className="bio-card-header">
    <div className="bio-header-icon">
      <FaHandshake/>
    </div>
    <h3 className="bio-section-title">Meeting Status</h3>
  </div>
  
  <div className="bio-card-body">
    {/* Side-by-side wrapper */}
    <div className="bio-meeting-row">
      
      {/* Left Form Group */}
      <div className="bio-meeting-form">
        <label className="bio-form-label">Check Status</label>
        <select className="bio-dropdown">
          <option value="">Select Meeting</option>
          <option>Meeting 1</option>
          <option>Meeting 2</option>
          <option>Meeting 3</option>
        </select>
        <input type="date" className="bio-input" />
        <button className="bio-btn-ok">Status</button>
      </div>

      {/* Vertical Divider */}
      <div className="bio-meeting-divider"></div>

      {/* Right Form Group */}
      <div className="bio-meeting-form">
        <label className="bio-form-label">Update Meeting</label>
        <select className="bio-dropdown">
          <option value="">Select Meeting</option>
          <option>Meeting 1</option>
          <option>Meeting 2</option>
          <option>Meeting 3</option>
        </select>
        <input type="date" className="bio-input" />
        <button className="bio-btn-ok">Update</button>
      </div>
      
    </div>
  </div>
</div>
        </div>

        {/* Actions Panel */}
        <div className="bio-actions-panel">
          <div className="bio-card-header">
            <div className="bio-header-icon">
              <FaTools/>
            </div>
            <h3 className="bio-section-title">Actions</h3>
          </div>

          {/* Meetings Quick Actions */}
          <div className="bio-subsection">
            <h4 className="bio-subsection-title">Meetings</h4>
            {renderActionItems(meetingActions, "meetings")}
          </div>

          {/* Notifications */}
          <div className="bio-subsection">
            <h4 className="bio-subsection-title">Notifications</h4>
            
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
            <button className="bio-popup-close" onClick={() => setPopup(null)}>
              Close
            </button>
            <iframe src={popup.route} title={popup.title} className="bio-iframe" />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAndMeetings;