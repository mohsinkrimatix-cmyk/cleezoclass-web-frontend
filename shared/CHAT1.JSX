
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Styles
const fixedCardStyle = { 
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid #ddd',
  backgroundColor: '#fff',
  // New styles for fixed size and improved look
  minHeight: '220px', // Set a minimum height for consistency
  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  // Flex basis for even width distribution across the two columns
  flexBasis: '48%', 
};
  const sectionTitle = {
    fontSize: "20px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "10px",
    textAlign: "center",
    padding:"0",
  };
// --- UPDATED STYLES FOR FIXED WIDTH ---
const FIXED_SELECT_INPUT_WIDTH = '150px';
const FIXED_BUTTON_WIDTH = '120px';

const smallSelectStyle = {
  padding: '8px 16px',
  borderRadius: '16px',
  border: 'none',
  width: FIXED_SELECT_INPUT_WIDTH, // Fixed width
  backgroundColor: '#506e88', // Slightly adjusted color
  color: '#fff',
  transition: 'background-color 0.3s'
};
const smallInputStyle = {
  padding: '8px 16px',
  borderRadius: '16px',
  border: 'none',
  width: FIXED_SELECT_INPUT_WIDTH, // Fixed width
  backgroundColor: '#506e88', // Slightly adjusted color
  color: '#fff',
  // Make date/time text visible
  colorScheme: 'dark' 
};
const btnPrimary = { 
  padding: '10px', 
  borderRadius: '16px', 
  border: 'none', 
  backgroundColor: '#506e88', // Green for primary action
  color: 'white', 
  fontWeight: 'bold', 
  width: FIXED_BUTTON_WIDTH, // Fixed width
  flex: '0 0 auto', // Ensure fixed size
  cursor: 'pointer',
  transition: 'background-color 0.3s'
};
const btnSecondary = { 
  padding: '10px', 
  borderRadius: '16px', 
  border: 'none', 
  backgroundColor: '#506e88', // Orange for secondary/group action
  color: 'white', 
  fontWeight: 'bold', 
  width: FIXED_BUTTON_WIDTH, // Fixed width
  flex: '0 0 auto', // Ensure fixed size
  cursor: 'pointer',
  transition: 'background-color 0.3s'
};
const btnRed = {
    padding: '6px 14px',
    backgroundColor: '#506e88',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    width: FIXED_BUTTON_WIDTH, // Fixed width
    flex: '0 0 auto', // Ensure fixed size
    cursor: 'pointer',
    transition: 'background-color 0.3s'
};
// --- END UPDATED STYLES ---


const ChatOperations = () => {
  const [party1List, setParty1List] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [sessionIds, setSessionIds] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [complaintActions, setComplaintActions] = useState([]);
  const [statusEventId, setStatusEventId] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const handleUpdateEventStatus = () => {
    console.log("Event: ", statusEventId);
    console.log("Status: ", eventStatus);
    // Add your API call here
  };
  // Individual chat states
  const [indParty1, setIndParty1] = useState('');
  const [indClass, setIndClass] = useState('');
  const [indSection, setIndSection] = useState('');
  const [indStudent, setIndStudent] = useState('');
  const [indDate, setIndDate] = useState('');
  const [indTime, setIndTime] = useState('');

  // Group chat states
  const [grpParty1, setGrpParty1] = useState('');
  const [grpClass, setGrpClass] = useState('');
  const [grpSection, setGrpSection] = useState('');
  const [grpDate, setGrpDate] = useState('');
  const [grpTime, setGrpTime] = useState('');
  
  // New Schedule Request states (separated from individual chat)
  const [schClass, setSchClass] = useState('');
  const [schSection, setSchSection] = useState('');
  const [schDate, setSchDate] = useState('');
  const [schTime, setSchTime] = useState('');
  
  // New Meeting/Agenda states
  const [meetingNo, setMeetingNo] = useState('');
  const [agenda, setAgenda] = useState('');
  const [newAgendaItem, setNewAgendaItem] = useState(''); // For Add Agenda / Delete
  const [fileToUpload, setFileToUpload] = useState(null); // For Add Agenda / Delete - Upload
  const [selectedReportMeeting, setSelectedReportMeeting] = useState(''); // For Report

  // Holiday states
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [selectedHoliday, setSelectedHoliday] = useState("");
  const [holidaysList, setHolidaysList] = useState([ // Dynamic list from backend/state
    { id: 1, name: "Diwali", date: "2025-10-29" },
    { id: 2, name: "Christmas", date: "2025-12-25" }
  ]);
  const [selectedFestival, setSelectedFestival] = useState(""); // For Festival/Holiday card

  const complaintReceivers = [ "Principal", "Vice Principal", "Admin", "Teacher", "HR" ];
  const [complaintTo, setComplaintTo] = useState("");

  const meetingList = ["1", "2", "3", "4", "5"]; // or fetch from backend
  const agendaList = [
    "Introduction",
    "Discussion Point 1",
    "Discussion Point 2",
    "Parent Complaints",
    "Student Behaviour",
    "Homework Follow-up",
    "Final Decision"
  ];
  const festivalList = ["Holi", "Eid", "Thanksgiving"]; // Mock data

  // --- HANDLERS FOR NEW FEATURES ---
const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipientType, setRecipientType] = useState('students');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notificationLinks, setNotificationLinks] = useState(null);

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const schoolCode = localStorage.getItem('schoolCode');
        const response = await axios.get('https://cleezoclass.com:5000/api/events', {
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
  }, []);

  // Handle dropdown selection
  const handleEventChange = (e) => {
    const id = Number(e.target.value);
    const event = events.find((ev) => ev.id === id);
    setSelectedEvent(event);
    setEventDetails(null); // Clear previous details until Generate is clicked
  };

  // Manual Generate button
  const handleGenerateManual = () => {
    if (!selectedEvent || !title) {
      alert('Please select an event and enter a title.');
      return;
    }
    console.log('Manual Generate:', { event: selectedEvent, title, description });
    setEventDetails({ ...selectedEvent, title, description });
    alert(
      `Manual Event Generated:\nEvent: ${selectedEvent.event_name}\nTitle: ${title}\nDescription: ${description}`
    );
  };

  // Automatic Generate button
  const handleGenerateAutomatic = () => {
    if (!selectedEvent) {
      alert('Please select an event.');
      return;
    }
    console.log('Automatic Generate:', selectedEvent);
    setEventDetails(selectedEvent);
    alert(`Automatic Event Generated:\nEvent: ${selectedEvent.event_name}`);
  };

  // Handle image download
  const handleImageDownload = (imageData) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${imageData}`;
    link.download = `${eventDetails.event_name}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleSendHoliday = () => {
    if (!holidayDate || !holidayName) {
      alert("Please select date and enter holiday name");
      return;
    }

    // API Call to add holiday
    axios.post('https://cleezoclass.com:5000/api/holidays', { date: holidayDate, name: holidayName })
      .then(res => {
        alert('Holiday Added!');
        // Ideally, refetch the holiday list here: fetchHolidays();
        setHolidaysList(prev => [...prev, { id: Date.now(), name: holidayName, date: holidayDate }]); // Mock update
        setHolidayDate("");
        setHolidayName("");
      })
      .catch(err => console.error("Error adding holiday:", err));
  };

  const handleDeleteHoliday = () => {
    if (!selectedHoliday) {
      alert("Please select a holiday to delete");
      return;
    }

    // API Call to delete holiday
    axios.delete(`https://cleezoclass.com:5000/api/holidays/${selectedHoliday}`)
      .then(() => {
        alert(`Holiday ID ${selectedHoliday} Deleted!`);
        setHolidaysList(prev => prev.filter(h => h.id !== Number(selectedHoliday)));
        setSelectedHoliday("");
      })
      .catch(err => console.error("Error deleting holiday:", err));
  };

  const handleAddAgenda = () => {
      if (!meetingNo || !newAgendaItem) return alert('Select Meeting No and enter Agenda Item');
      
      // API Call to add agenda item
      axios.post('https://cleezoclass.com:5000/api/agenda', { meetingNo, agendaItem: newAgendaItem })
        .then(res => {
            alert(`Agenda item "${newAgendaItem}" added to Meeting No ${meetingNo}!`);
            setNewAgendaItem('');
        })
        .catch(err => console.error("Error adding agenda:", err));
  };

  const handleUploadMinutes = () => {
      if (!meetingNo || !fileToUpload) return alert('Select Meeting No and choose a file to upload');

      const formData = new FormData();
      formData.append('meetingNo', meetingNo);
      formData.append('minutesFile', fileToUpload);

      // API Call to upload minutes
      axios.post('https://cleezoclass.com:5000/api/minutes/upload', formData, {
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      })
      .then(res => {
          alert(`Minutes uploaded for Meeting No ${meetingNo}!`);
          setFileToUpload(null);
      })
      .catch(err => console.error("Error uploading minutes:", err));
  };
  
  const handleScheduleRequest = () => {
    if (!schClass || !schSection || !schDate || !schTime) return alert('Please fill all fields for Schedule Request');
    
    axios.post('https://cleezoclass.com:5000/api/schedule', {
      class: schClass,
      section: schSection,
      date: schDate,
      time: schTime
    }).then(res => {
      if (res.data.success) {
        alert('Schedule request saved!');
        setSchClass('');
        setSchSection('');
        setSchDate('');
        setSchTime('');
      }
    }).catch(err => console.error("Error saving schedule:", err));
  };


  // Helper function to get removed IDs from localStorage
  const getRemovedIds = () => {
    const removedIds = localStorage.getItem('removedChatRequestIds');
    return removedIds ? JSON.parse(removedIds) : [];
  };

  // Helper function to add an ID to localStorage
  const addRemovedId = (id) => {
    const removedIds = getRemovedIds();
    if (!removedIds.includes(id)) {
      removedIds.push(id);
      localStorage.setItem('removedChatRequestIds', JSON.stringify(removedIds));
    }
  };

  useEffect(() => {
    axios.get('https://cleezoclass.com:5000/api/party1').then(res => setParty1List(res.data));
    axios.get('https://cleezoclass.com:5000/api/classes').then(res => setClasses(res.data));
    fetchChatRequests();
    // fetchHolidays(); // Uncomment and implement
  }, []);

  // FIX: Watch all class states for fetching sections
  useEffect(() => {
    let classToFetch = indClass || grpClass || schClass;
    
    if (classToFetch) {
      axios.get(`https://cleezoclass.com:5000/api/sections/${classToFetch}`)
        .then(res => {
          setSections(res.data);
          // Clear related fields only for the class that triggered the change
          if (indClass === classToFetch) {
            setIndSection('');
            setStudents([]);
            setIndStudent('');
          } else if (grpClass === classToFetch) {
            setGrpSection('');
          } else if (schClass === classToFetch) {
            setSchSection('');
          }
        })
        .catch(err => console.error("Error fetching sections:", err));
    } else {
      setSections([]);
    }
  }, [indClass, grpClass, schClass]); 

  useEffect(() => {
    if (indClass && indSection) {
      axios.get(`https://cleezoclass.com:5000/api/students/${indClass}/${indSection}`).then(res => setStudents(res.data));
      setIndStudent('');
    }
  }, [indClass, indSection]);

  useEffect(() => {
    axios.get("https://cleezoclass.com:5000/api/chat_requests/sessions")
      .then(res => setSessionIds(res.data))
      .catch(err => console.error("Error fetching sessions:", err));
  }, []);

  const fetchChatRequests = () => {
    axios.get('https://cleezoclass.com:5000/api/chat-requests')
      .then(res => {
        const removedIds = getRemovedIds();
        setChatRequests(res.data.filter(req => !removedIds.includes(req.id)));
      });
  };

  const handleIndividualChat = () => {
    if (!indParty1 || !indClass || !indSection || !indStudent) return alert('Please fill all fields');
    const party1Obj = party1List.find(p => p.name === indParty1);
    axios.post('https://cleezoclass.com:5000/api/chat-request', {
      party1_id: party1Obj.id,
      party1_name: party1Obj.name,
      party2_class: indClass,
      party2_section: indSection,
      party2_student: indStudent,
      date: indDate,
      time: indTime
    }).then(res => {
      if (res.data.success) {
        alert('Individual chat request saved!');
        setIndParty1('');
        setIndClass('');
        setIndSection('');
        setIndStudent('');
        setIndDate('');
        setIndTime('');
        fetchChatRequests();
      }
    });
  };

  const handleGroupChat = () => {
    if (!grpParty1 || !grpClass || !grpSection) return alert('Please fill all fields');
    const party1Obj = party1List.find(p => p.name === grpParty1);
    axios.post('https://cleezoclass.com:5000/api/chat-request', {
      party1_id: party1Obj.id,
      party1_name: party1Obj.name,
      party2_class: grpClass,
      party2_section: grpSection,
      party2_student: null,
      date: grpDate,
      time: grpTime
    }).then(res => {
      if (res.data.success) {
        alert('Group chat request saved!');
        setGrpParty1('');
        setGrpClass('');
        setGrpSection('');
        setGrpDate('');
        setGrpTime('');
        fetchChatRequests();
      }
    });
  };
const sectionHeading = { fontSize: 20, fontWeight: '700', marginTop: 10, marginBottom: 15, color: '#333' };
  const row = { display: 'flex', gap: 15, marginBottom: 15 };
  const selectStyle = { flex: 1, padding: 12, borderRadius: 10, border: '1px solid #dcdcdc', fontSize: 15, outline: 'none', backgroundColor: '#fafafa' };
  const inputStyle = { flex: 1, padding: 12, borderRadius: 10, border: '1px solid #dcdcdc', fontSize: 15, outline: 'none', backgroundColor: '#fafafa' };
const textarea = { width: '100%', height: 70, padding: 20, borderRadius: '16px', border: '1px solid #dcdcdc', fontSize: 15, resize: 'none', outline: 'none', backgroundColor: '#fafafa' };
const mainContent = {
  display: "flex",
  gap: "20px",
  alignItems: "stretch", // Ensures both containers stretch to the same height
  flexWrap: "nowrap", // Prevents wrapping to ensure side-by-side layout
  height: "calc(100vh - 300px)", // Adjust this value based on your header and other fixed elements
};const generateBtn = {
  width: "100%",
  padding: 12,
  backgroundColor: "rgba(141,171,182,255)",
  border: "none",
  color: "white",
  fontWeight: "bold",
  borderRadius: "6px",
  cursor: "pointer",
};

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  const card = {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    padding: "20px",
    flex: "1 1 45%",
    minWidth: "300px",
    height: "280px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'Left', marginBottom: '25px', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>operations - Events & Meetings</h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom:'50px' }}>
        
        {/* LEFT SIDE - CHAT SETUP & UTILITIES */}
     <div style={{
  width: '65%', 
  display: 'flex',
  gap: '30px', 
  backgroundColor: '#fff', 
  borderRadius: '15px', 
  padding: '30px', 
  boxShadow: '0 6px 18px rgba(0,0,0,0.1)', // Enhanced shadow
      borderLeft: "8px solid #738368ff",

}}>
  {/* The four cards will be laid out in a grid/wrap fashion here */}
  <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '20px', // Spacing between the cards
      width: '100%' 
      }}>

    {/* Individual Chat Request */}
    <div style={fixedCardStyle}>
       <div style={sectionTitle}> Individual Chat Request</div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px', justifyContent: 'flex-start' }}>
        <select value={indParty1} onChange={e => setIndParty1(e.target.value)} style={smallSelectStyle}>
          <option value="">Party 1</option>
          {party1List.map(p => <option key={p.id} value={p.name}>{p.name} ({p.user_type})</option>)}
        </select>

        <select value={indClass} onChange={e => setIndClass(e.target.value)} style={smallSelectStyle}>
          <option value="">Class</option>
          {classes.map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
        </select>

        <select value={indSection} onChange={e => setIndSection(e.target.value)} disabled={!indClass} style={smallSelectStyle}>
          <option value="">Section</option>
          {sections.map((sec, i) => <option key={i} value={sec}>{sec}</option>)}
        </select>

        <select value={indStudent} onChange={e => setIndStudent(e.target.value)} disabled={!indClass || !indSection} style={smallSelectStyle}>
          <option value="">Student</option>
{students.map((s) => (
  <option key={s.id} value={s.name}>{s.name}</option>
))}
        </select>

        <input type="date" value={indDate} onChange={e => setIndDate(e.target.value)} style={smallInputStyle} />
        <input type="time" value={indTime} onChange={e => setIndTime(e.target.value)} style={smallInputStyle} />

        <button onClick={handleIndividualChat} style={btnPrimary}>Fix</button>
      </div>
    </div>
 {/* Complaints */}
<div style={fixedCardStyle}>
    <div style={sectionTitle}>Complaints</div>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      justifyContent: 'space-between',
      flexGrow: 1
    }}
  >
{/* Session No + Complaint To in one row */}
<div
  style={{
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
    alignItems: 'center'
  }}
>
  {/* Session No */}
  <div style={{ flex: 1 }}>
    <strong>Session No:</strong>
    <select
      value={selectedSession}
      onChange={(e) => setSelectedSession(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 10px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#506e88',
        fontSize: '14px',
        marginTop: '5px',
        color:'#fff'
      }}
    >
      <option value="">Select</option>
      {sessionIds.map((session) => (
        <option key={session.id} value={session.id}>
          {session.id}
        </option>
      ))}
    </select>
  </div>

  {/* Complaint To */}
  <div style={{ flex: 1 }}>
    <strong>Complaint To:</strong>
    <select
      value={complaintTo}
      onChange={(e) => setComplaintTo(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 10px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#506e88',
        fontSize: '14px',
        marginTop: '5px',
        color:'#fff'
      }}
    >
      <option value="">Select</option>
      {complaintReceivers.map((r, i) => (
        <option key={i} value={r}>
          {r}
        </option>
      ))}
    </select>
  </div>
</div>



    {/* Bottom Buttons */}
    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      <button style={btnSecondary}>Recorded Chat</button>
      <button style={{ ...btnSecondary,  color: '#fff' }}>Red Tag</button>
    </div>
  </div>
</div>

    {/* Group Chat Request */}
    <div style={fixedCardStyle}>
       <div style={sectionTitle}> Group Chat Request</div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px', justifyContent: 'flex-start' }}>
        <select value={grpParty1} onChange={e => setGrpParty1(e.target.value)} style={smallSelectStyle}>
          <option value="">Party 1</option>
          {party1List.map(p => <option key={p.id} value={p.name}>{p.name} ({p.user_type})</option>)}
        </select>

        <select value={grpClass} onChange={e => setGrpClass(e.target.value)} style={smallSelectStyle}>
          <option value="">Class</option>
          {classes.map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
        </select>

        <select value={grpSection} onChange={e => setGrpSection(e.target.value)} disabled={!grpClass} style={smallSelectStyle}>
          <option value="">Section</option>
          {sections.map((sec, i) => <option key={i} value={sec}>{sec}</option>)}
        </select>

        <input type="date" value={grpDate} onChange={e => setGrpDate(e.target.value)} style={smallInputStyle} />
        <input type="time" value={grpTime} onChange={e => setGrpTime(e.target.value)} style={smallInputStyle} />

        <button onClick={handleGroupChat} style={btnSecondary}>Fix</button>
      </div>
    </div>
    
   

    {/* Customize Chat */}
    <div style={fixedCardStyle}>
        <div style={sectionTitle}> Customize Chat</div>
      <p style={{ color: '#666' }}>Add custom settings or predefined topics here.</p>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'flex-start'
      }}>
        {/* Using a custom style for these buttons as they are simple tags */}
        <button style={{ 
          padding: '8px 12px', 
          borderRadius: '8px', 
          border: '1px solid #ccc', 
          backgroundColor: '#f0f0f0',
          width: 'auto', // Keep these flexible
          flex: '0 0 auto'
          }}>Topic 1</button>
        <button style={{ 
          padding: '8px 12px', 
          borderRadius: '8px', 
          border: '1px solid #ccc', 
          backgroundColor: '#f0f0f0',
          width: 'auto', // Keep these flexible
          flex: '0 0 auto'
          }}>Topic 2</button>
      </div>
    </div>
  </div>
</div>

        {/* RIGHT SIDE - Actions */}
      <div
  style={{
    width: '30vw',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Separate shadow for emphasis
    overflowX: 'auto',
    position: 'relative',
        borderLeft: "8px solid #945f4aff",

  }}
>
     <div style={sectionTitle}>Actions </div>
  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
    <tbody>
      {/* Chat Requests */}
      {chatRequests.map(req => (
        <tr
          key={`chat-${req.id}`}
          style={{
            backgroundColor: '#fffbe6', // Light yellow for attention
            marginBottom: '10px',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '1px solid #ffcc00'
          }}
          onClick={() => setExpandedId(req.id)}
        >
          <td style={{ padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
              Chat Approval Pending
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                fontSize: '14px'
              }}
            >
              <div>
                <strong>Session ID:</strong> {req.id || '-'}
              </div>
             <button
  onClick={e => {
    e.stopPropagation();
    addRemovedId(req.id);
    alert(`Approval sent to Chief for ID ${req.id}`);
    setChatRequests(prev => prev.filter(r => r.id !== req.id));
  }}
  // Use a fixed-width style here, but adjust padding for a smaller visual footprint
  style={{
    padding: '6px 10px',
    backgroundColor: '#1E90FF', // Dodger Blue for action
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: '80px', // Smaller fixed width for in-table button
    flex: '0 0 auto'
  }}
>
  Approve
</button>
            </div>
          </td>
        </tr>
      ))}
      {/* Complaint Actions */}
      {complaintActions.map(action => (
        <tr
          key={`complaint-${action.id}`}
          style={{ 
            backgroundColor: '#ffe6e6', // Light red for complaint
            marginBottom: '10px',
            borderRadius: '8px',
            border: '1px solid #ff0000'
          }}
        >
          <td style={{ padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#CC0000' }}>
              Chat Complaint Filed
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                fontSize: '14px'
              }}
            >
              <div>
                <strong>Session ID:</strong> {action.sessionId}
              </div>
              <button
                onClick={() =>
                  alert(`Complaint for Session ID ${action.sessionId} marked as resolved`)
                }
                 // Use a fixed-width style here, but adjust padding for a smaller visual footprint
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#4CAF50', // Green for resolve
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: '80px', // Smaller fixed width for in-table button
                  flex: '0 0 auto'
                }}
              >
                Resolve
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  {/* Modal inside tab */}
  {expandedId && (
    <div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '15px',
          width: '80%',
          maxHeight: '70%',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}
      >
        {chatRequests
          .filter(r => r.id === expandedId)
          .map(req => (
            <div key={req.id}>
              <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Chat Request Details (ID: {req.id})</h3>
              <div style={{ marginBottom: '12px' }}>
                <strong>Party 1:</strong> {req.party1_name}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  marginBottom: '12px',
                  backgroundColor: '#f0f4f7',
                  padding: '10px',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <strong>Class:</strong> {req.party2_class || '-'}
                </div>
                <div>
                  <strong>Section:</strong> {req.party2_section || '-'}
                </div>
                <div>
                  <strong>Party 2:</strong> {req.party2_student || 'Group Chat'}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <strong>Date:</strong>{' '}
                  {req.date ? new Date(req.date).toLocaleDateString() : '-'}
                </div>
                <div>
                  <strong>Time:</strong> {req.time || '-'}
                </div>
              </div>
              <button
                onClick={() => setExpandedId(null)}
                style={{
                  marginTop: '20px',
                  padding: '10px 15px',
                  backgroundColor: '#f04f4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: FIXED_BUTTON_WIDTH, // Fixed width
                  flex: '0 0 auto'
                }}
              >
                Close
              </button>
            </div>
          ))}
      </div>
    </div>
  )}
</div>
      </div>
       <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* LEFT SIDE - CHAT SETUP & UTILITIES */}
     <div style={{
  width: '65%', 
  display: 'flex',
  gap: '30px', 
  backgroundColor: '#fff', 
  borderRadius: '15px', 
  padding: '30px', 
        borderLeft: "8px solid #738368ff",

  boxShadow: '0 6px 18px rgba(0,0,0,0.1)' // Enhanced shadow
}}>
  {/* The four cards will be laid out in a grid/wrap fashion here */}
  <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '20px', // Spacing between the cards
      width: '100%' 
      }}>

    {/* Schedule Request (Uses dedicated state) */}
    <div style={fixedCardStyle}>
       <div style={sectionTitle}> Schedule Request</div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px', justifyContent: 'flex-start' }}>
       
        <select value={schClass} onChange={e => setSchClass(e.target.value)} style={smallSelectStyle}>
          <option value="">Class</option>
          {classes.map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
        </select>

        <select value={schSection} onChange={e => setSchSection(e.target.value)} disabled={!schClass} style={smallSelectStyle}>
          <option value="">Section</option>
          {sections.map((sec, i) => <option key={i} value={sec}>{sec}</option>)}
        </select>

        <input type="date" value={schDate} onChange={e => setSchDate(e.target.value)} style={smallInputStyle} />
        <input type="time" value={schTime} onChange={e => setSchTime(e.target.value)} style={smallInputStyle} />

        <button onClick={handleScheduleRequest} style={btnPrimary}>Fix</button>
      </div>
    </div>
 {/* Agenda & Minuits */}
<div style={fixedCardStyle}>
 <div style={sectionTitle}> Agenda & Minutes</div>

  {/* Meeting No + Add Agenda dropdown in same row */}
  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
    
    {/* Meeting No Dropdown */}
    <select
      value={meetingNo}
      onChange={e => setMeetingNo(e.target.value)}
      style={smallSelectStyle}
    >
      <option value="">Select Meeting No</option>
      {meetingList.map((m, i) => (
        <option key={i} value={m}>{m}</option>
      ))}
    </select>

    {/* Add Agenda Dropdown (Using the new agenda item text field for simplicity) */}
    <input
        type="text"
        placeholder="New Agenda Item"
        value={newAgendaItem}
        onChange={e => setNewAgendaItem(e.target.value)}
        style={{...smallInputStyle, width: '200px', color: 'white'}}
    />

  </div>

  {/* Minutes + Schedule Buttons */}
  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
    <button onClick={handleAddAgenda} style={btnSecondary}>Add Agenda</button>
    <button style={btnSecondary}>Schedule</button>
  </div>
</div>

{/* Add Agenda / Delete */}
<div style={fixedCardStyle}>
   <div style={sectionTitle}> Add Agenda / Minutes Upload</div>

  {/* Meeting No + Upload button in same row */}
  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
    
    {/* Meeting No Dropdown */}
    <select
      value={meetingNo}
      onChange={e => setMeetingNo(e.target.value)}
      style={smallSelectStyle}
    >
      <option value="">Meeting No</option>
      {meetingList.map((m, i) => (
        <option key={i} value={m}>{m}</option>
      ))}
    </select>
    
    {/* Hidden file input, triggered by the button */}
    <input
        type="file"
        id="minutes-upload"
        style={{ display: 'none' }}
        onChange={e => setFileToUpload(e.target.files[0])}
    />
    <label htmlFor="minutes-upload" style={{...btnSecondary, textAlign: 'center', lineHeight: '20px', cursor: 'pointer'}}>
        {fileToUpload ? fileToUpload.name.substring(0, 10) + '...' : 'Choose File'}
    </label>
    <button onClick={handleUploadMinutes} style={btnSecondary}>Upload</button>

  </div>

  {/* Edit + Delete Buttons */}
  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
    <button style={btnSecondary}>Edit</button>
    <button style={btnSecondary}>Delete</button>
  </div>
</div>


    
   

    {/* Report */}
 <div style={fixedCardStyle}>
  <div style={sectionTitle}> Report</div>

  {/* Meeting No + Generate button in same row */}
  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
    
    {/* Meeting No Dropdown */}
    <select
      value={selectedReportMeeting}
      onChange={e => setSelectedReportMeeting(e.target.value)}
      style={smallSelectStyle}
    >
      <option value="">Meeting No</option>
      {meetingList.map((m, i) => (
        <option key={i} value={m}>{m}</option>
      ))}
    </select>

    {/* Generate Button (Replaced 'Upload' with 'Generate' in the original code's copy-paste error) */}
    <button style={btnSecondary}>Generate</button>

  </div>

  {/* View + Download Buttons (Replaced 'Edit + Delete' in the original code's copy-paste error) */}
  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
    <button style={btnSecondary}>View</button>
    <button style={btnSecondary}>Download</button>
  </div>
</div>

  </div>
</div>

        {/* RIGHT SIDE - Actions */}
      <div
  style={{
    width: '30vw',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Separate shadow for emphasis
    overflowX: 'auto',
    position: 'relative',
    display: 'flex', // Added to contain the cards
    flexDirection: 'column', // Stack cards vertically
    gap: '20px' ,// Gap between cards in this column,
        borderLeft: "8px solid #945f4aff",

  }}
>
   <div style={sectionTitle}>Calenderic </div>
{/* Festival/Holiday Card */}
 <div style={card}>
  {/* Manual Section */}
  <div style={sectionHeading}>Manual Event Entry</div>

  <div style={row}>
    <select style={selectStyle} value={selectedEvent?.id || ''} onChange={handleEventChange}>
      <option value="">Select Event</option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>{event.event_name}</option>
      ))}
    </select>

    <input
      type="text"
      maxLength={150}
      placeholder="Enter title…"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      style={inputStyle}
    />
  </div>

  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
    <textarea
      maxLength={150}
      placeholder="Write up to 150 characters..."
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      style={{ ...textarea, flex: 2 }}
    />
    <button
      style={{ ...generateBtn, flex: 1, marginTop: 0 }}
      onClick={handleGenerateManual}
    >
      Generate
    </button>
  </div>

  {/* Automatic Section */}
  <div style={{ ...sectionHeading, marginTop: 40 }}>Automatic Event Entry</div>

  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
    <select
      style={{ ...selectStyle, flex: 2, marginBottom: 0 }}
      value={selectedEvent?.id || ''}
      onChange={handleEventChange}
    >
      <option value="">Select Event</option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>{event.event_name}</option>
      ))}
    </select>

    <button
      style={{ ...generateBtn, flex: 1, marginTop: 0 }}
      onClick={handleGenerateAutomatic}
    >
      Generate
    </button>
  </div>

  {/* Event Details */}
  {eventDetails && (
    <div
      style={{
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginTop: '2rem',
        border: '1px solid #e5e7eb',
        width: '100%',
        maxWidth: '800px',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'semibold', marginBottom: '1rem' }}>
        Event Details
      </h2>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        {eventDetails.event_name}
      </h3>

      {eventDetails.title && (
        <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
          Title: {eventDetails.title}
        </p>
      )}

      {eventDetails.description && (
        <p style={{ marginBottom: '0.5rem' }}>
          Description: {eventDetails.description}
        </p>
      )}

      {eventDetails.image && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
          <img
            src={`data:image/jpeg;base64,${eventDetails.image}`}
            alt={eventDetails.event_name}
            style={{
              width: '100%',
              maxWidth: '300px',
              height: 'auto',
              objectFit: 'cover',
              borderRadius: '0.25rem',
              marginBottom: '0.75rem'
            }}
          />

          <button
            onClick={() => handleImageDownload(eventDetails.image)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              backgroundColor: '#5a7488',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Download Image
          </button>
        </div>
      )}
    </div>
  )}

  {/* ⭐ NEW — Event Status Section ⭐ */}
  <div style={{ marginTop: "40px" }}>
    <div style={sectionHeading}>Event Status</div>

    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
      
      {/* Select Event */}
      <select
        style={{ ...selectStyle, flex: 2 }}
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

      {/* Status Selection */}
      <select
        style={{ ...selectStyle, flex: 1 }}
        value={eventStatus}
        onChange={(e) => setEventStatus(e.target.value)}
      >
        <option value="">Status</option>
        <option value="upcoming">Upcoming</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {/* Button */}
      <button
        style={{ ...generateBtn, flex: 1 }}
        onClick={handleUpdateEventStatus}
      >
        Update
      </button>

    </div>
  </div>

  {isLoading && <p>Loading...</p>}
  {error && <p style={{ color: 'red' }}>{error}</p>}
</div>
</div>
      </div>
    </div>
  );
};
export default ChatOperations;