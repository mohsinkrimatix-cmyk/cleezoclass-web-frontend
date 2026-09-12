import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../STYLES/solidbutton.css'
;
import './Admin_events.css';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../shared/ScrollableSection";
import ErrorPopup from '../shared/ErrorPopup';

// Styles

const dateInputStyle = {
  color: "#000",
};


  const sectionTitle = {
    fontSize: "16px",
    fontWeight: "400",
    color: "#333",
    textAlign: "center",
    padding:"0",
      backgroundColor: 'transparent', // Slightly adjusted color


  };



// --- END UPDATED STYLES ---


const ChatOperations = () => {
  const [party1List, setParty1List] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [recentEventActions, setRecentEventActions] = useState(() => {
    try {
      const saved = localStorage.getItem("adminEventsRecentActions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });


    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);  
    const [events, setEvents] = useState([]); // Moved to top-level for clarity

    // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        // SCHOOL CODE INCLUDED HERE
        const schoolCode = localStorage.getItem('schoolCode');
        // NOTE: The backend URL is hardcoded to cleezoclass.com here, but most others use localhost:5000
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
  }, []);
  
  // New function to fetch holidays - SCHOOL CODE INCLUDED HERE
  const fetchHolidays = () => {
    const schoolCode = localStorage.getItem('schoolCode');
    axios.get('https://cleezoclass.com:4000/api/holidays', { params: { schoolCode } })
      .then(res => setHolidaysList(res.data))
      .catch(err => console.error("Error fetching holidays:", err));
  };
const [popup, setPopup] = useState({ message: "", type: "" });

  const logEventAction = (title, detail) => {
    const newAction = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title,
      detail,
      createdAt: new Date().toISOString(),
    };
    setRecentEventActions((prev) => [newAction, ...prev].slice(0, 25));
  };

  useEffect(() => {
    localStorage.setItem("adminEventsRecentActions", JSON.stringify(recentEventActions));
  }, [recentEventActions]);

  const [sessionIds, setSessionIds] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [complaintActions, setComplaintActions] = useState([]);
    const [statusEventId, setStatusEventId] = useState("");
    const [eventStatus, setEventStatus] = useState("");
    const [complaintText, setComplaintText] = useState("");
const [complaints, setComplaints] = useState([]);
const handleSubmitComplaint = async () => {
  if (!selectedSession || !complaintTo || !indParty1 || !complaintText) {
    setPopup({
      message: "Please fill all complaint fields",
      type: "error"
    });
    return;
  }

  const schoolCode = localStorage.getItem("schoolCode");
  const partyObj = party1List.find(p => p.name === indParty1);

  try {
    await axios.post(
      "https://cleezoclass.com:4000/api/chat_requests/create",
      {
        schoolCode,
        sessionId: selectedSession,
        complaintTo,
        party1Name: partyObj.name,
        party1Type: partyObj.user_type,
        complaintText
      }
    );

    setPopup({
      message: " Complaint submitted successfully",
      type: "success"
    });
    logEventAction("Complaint submitted", `Session ${selectedSession} to ${complaintTo}`);

    setComplaintText("");
    setSelectedSession("");
    setComplaintTo("");
    setIndParty1("");

  } catch (err) {
    console.error(err);
    setPopup({
      message: "❌ Failed to submit complaint",
      type: "error"
    });
  }
};

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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  // Group chat states
  const [grpParty1, setGrpParty1] = useState('');
  const [grpClass, setGrpClass] = useState('');
  const [grpSection, setGrpSection] = useState('');
  const [grpDate, setGrpDate] = useState('');
  const [grpTime, setGrpTime] = useState('');

    // Manual Generate button - FIX: Removed !title check
  const handleGenerateManual = () => {
    if (!selectedEvent) {
setPopup({
  message: "Kindly select an event before proceeding.",
  type: "error"
});
      return;
    }
    console.log('Manual Generate:', { event: selectedEvent, title, description });
    setEventDetails({ ...selectedEvent, title, description });
   alert(
  `✅ Event Generated Successfully!\n\nEvent: ${selectedEvent.event_name}\nTitle: ${title}\nDescription: ${description}\n\nThank you for updating the records.`
);

  };
  // Handle dropdown selection
  const handleEventChange = (e) => {
    const id = Number(e.target.value);
    const event = events.find((ev) => ev.id === id);
    setSelectedEvent(event);
    setEventDetails(null); // Clear previous details until Generate is clicked
  };

  // Automatic Generate button
  const handleGenerateAutomatic = () => {
    if (!selectedEvent) {
      alert('Please select an event.');
      return;
    }
    console.log('Automatic Generate:', selectedEvent);
    setEventDetails(selectedEvent);
setPopup({
  message: `✅ Automatic Event Created Successfully!\n\nEvent: ${selectedEvent.event_name}\n\nThe event has been added to the schedule.`,
  type: "success"
});


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
  const [holidaysList, setHolidaysList] = useState([]); // Now dynamic
  const [selectedFestival, setSelectedFestival] = useState(""); // For Festival/Holiday card

const complaintReceivers = ["superadmin", "admin", "teacher", "hr"];
  const [complaintTo, setComplaintTo] = useState("");

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

  // SCHOOL CODE INCLUDED HERE
const handleSendHoliday = () => {
  if (!holidayDate || !holidayName) {
    setPopup({
      message: "Kindly select a date and enter the holiday name before proceeding.",
      type: "error"
    });
    return;
  }
  const schoolCode = localStorage.getItem('schoolCode');

  // API Call to add holiday
  axios.post('https://cleezoclass.com:4000/api/holidays', { date: holidayDate, name: holidayName, schoolCode })
    .then(res => {
      setPopup({
        message: "🎉 Holiday has been successfully added!",
        type: "success"
      });
      fetchHolidays(); // Refetch the list to update the dropdowns
      logEventAction("Holiday added", `${holidayName} on ${holidayDate}`);
      setHolidayDate("");
      setHolidayName("");
    })
    .catch(err => {
      console.error("Error adding holiday:", err);
      setPopup({
        message: "❌ Failed to add holiday. Please try again.",
        type: "error"
      });
    });
};

  // SCHOOL CODE INCLUDED HERE
const handleDeleteHoliday = () => {
  if (!selectedHoliday) {
    setPopup({
      message: "⚠️ Kindly select a holiday to delete.",
      type: "error"
    });
    return;
  }
  const schoolCode = localStorage.getItem('schoolCode');

  // API Call to delete holiday
  axios.delete(`https://cleezoclass.com:4000/api/holidays/${selectedHoliday}`, { params: { schoolCode } })
    .then(() => {
      setPopup({
        message: `✅ Holiday ID ${selectedHoliday} Deleted!`,
        type: "success"
      });
      fetchHolidays(); // Refetch the list to update the dropdowns
      logEventAction("Holiday deleted", `Holiday ID ${selectedHoliday}`);
      setSelectedHoliday("");
    })
    .catch(err => {
      console.error("Error deleting holiday:", err);
      setPopup({
        message: "❌ Failed to delete holiday. Please try again.",
        type: "error"
      });
    });
};

    const [showModal, setShowModal] = useState(false); // controls popup visibility

  // Handler for Festival/Holiday Delete
const handleDeleteFestival = (eventId) => {
  if (!selectedEvent) {
    setPopup({
      message: "⚠️ Please select an event to delete.",
      type: "error"
    });
    return;
  }
  // Implement your festival/event deletion API call here
  setPopup({
    message: `Festival/Event ID ${selectedEvent.id} (${selectedEvent.event_name}) is now marked for deletion (Client-side mock).`,
    type: "success"
  });
  // Example: axios.delete(`https://cleezoclass.com:4000/api/events/${selectedEvent.id}`, { params: { schoolCode: localStorage.getItem('schoolCode') } })
  setSelectedEvent(null);
  setEventDetails(null);
  setEvents(prev => prev.filter(e => e.id !== selectedEvent.id)); // Mock removal
};

  
  // Handler for Festival/Holiday Edit
const handleEditFestival = () => {
  if (!selectedEvent) {
    setPopup({
      message: "Please select an event to edit.",
      type: "error"
    });
    return;
  }

  setPopup({
    message: `Editing Festival/Event ID ${selectedEvent.id} (${selectedEvent.event_name}). Please implement the edit form.`,
    type: "info"
  });
};


    const [meetingList, setMeetingList] = useState([]);
 
useEffect(() => {
  const schoolCode = localStorage.getItem("schoolCode"); // Get schoolCode
  console.log("Retrieved schoolCode from localStorage:", schoolCode);

  if (!schoolCode) {
    console.warn("No schoolCode found in localStorage. Aborting fetch.");
    return;
  }

  // Fetch meeting IDs for this school
  axios
    .get(`https://cleezoclass.com:4000/api/meetings?schoolCode=${schoolCode}`)
    .then((res) => {
      console.log("Raw response from backend:", res);
      console.log("Meeting data received:", res.data);
      setMeetingList(res.data);
    })
    .catch((err) => {
      console.error("Error fetching meetings:", err);
    });
}, []);



  // SCHOOL CODE INCLUDED HERE
const handleAddAgenda = () => {
  if (!meetingNo || !newAgendaItem) {
    setPopup({
      message: "Kindly select a Meeting No and enter an Agenda Item before proceeding.",
      type: "error"
    });
    return;
  }

  const schoolCode = localStorage.getItem('schoolCode');

  axios.post('https://cleezoclass.com:4000/api/agenda', {
    meetingNo,
    agendaItem: newAgendaItem,
    schoolCode
  })
  .then(res => {
    setPopup({
      message: `✅ Agenda item "${newAgendaItem}" has been successfully added to Meeting No ${meetingNo}.`,
      type: "success"
    });
    setNewAgendaItem('');
    logEventAction("Agenda added", `Meeting ${meetingNo}: ${newAgendaItem}`);
  })
  .catch(err => {
    console.error("Error adding agenda:", err);
    setPopup({
      message: "❌ Error adding agenda. Please try again.",
      type: "error"
    });
  });
};


const handleUploadMinutes = (file) => {
  console.log("📤 Upload Minutes triggered");

  if (!meetingNo || !file) {
    console.warn("⚠️ Missing meetingNo or file", { meetingNo, file });
    setPopup({
      message: "Kindly select a Meeting No and choose a file before proceeding.",
      type: "error"
    });
    return;
  }

  const schoolCode = localStorage.getItem("schoolCode");

  const formData = new FormData();
  formData.append("meetingNo", meetingNo);
  formData.append("minutesFile", file);
  formData.append("schoolCode", schoolCode);

  console.log("📦 Uploading FormData...");
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  axios
    .post("https://cleezoclass.com:4000/minutes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(() => {
      setPopup({
        message: "✅ Minutes have been successfully uploaded!",
        type: "success"
      });
      setFileToUpload(null);
      fetchMeetingMinutes(); // refresh list
    })
    .catch((err) => {
      console.error("❌ Upload error:", err);
      setPopup({
        message: "❌ Error uploading minutes. Please try again.",
        type: "error"
      });
    });
};

  const [showMinutes, setShowMinutes] = useState(false); // controls when minutes are visible

const handleEditMinutes = (id) => {
  if (!fileToUpload) {
    setPopup({
      message: "Kindly select a new file to edit.",
      type: "error"
    });
    return;
  }

  const formData = new FormData();
  const schoolCode = localStorage.getItem('schoolCode');

  formData.append('minutesFile', fileToUpload);
  formData.append('schoolCode', schoolCode);

  axios.put(`https://cleezoclass.com:4000/api/minutes/edit/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  .then(res => {
    setPopup({
      message: "Minutes have been successfully updated!",
      type: "success"
    });
    setFileToUpload(null);
    fetchMeetingMinutes();
    setShowMinutes(true);
  })
  .catch(err => {
    console.error("Error updating minutes:", err);
    setPopup({
      message: "❌ Error updating minutes. Please try again.",
      type: "error"
    });
  });
};

const handleDeleteMinutes = (id) => {
  const schoolCode = localStorage.getItem('schoolCode');
  axios.delete(`https://cleezoclass.com:4000/api/minutes/delete/${id}`, { params: { schoolCode } })
    .then(res => {
      setPopup({
        message: "Minutes deleted successfully!",
        type: "success"
      });
      fetchMeetingMinutes();
      setShowMinutes(true);
    })
    .catch(err => {
      console.error("Error deleting minutes:", err);
      setPopup({
        message: "❌ Error deleting minutes. Please try again.",
        type: "error"
      });
    });
};

const [meetingMinutes, setMeetingMinutes] = useState([]);
const fetchMeetingMinutes = () => {
  const schoolCode = localStorage.getItem('schoolCode');

  console.log("📌 fetchMeetingMinutes called");
  console.log("🏫 schoolCode from localStorage:", schoolCode);

  if (!schoolCode) {
    console.warn("⚠️ schoolCode is missing in localStorage");
    return;
  }

  axios
    .get('https://cleezoclass.com:4000/minutes', {
      params: { schoolCode }
    })
    .then(res => {
      console.log("✅ API response status:", res.status);
      console.log("📦 Raw API response data:", res.data);

      if (!Array.isArray(res.data)) {
        console.warn("⚠️ Response is NOT an array:", res.data);
      }

      setMeetingMinutes(res.data);
      console.log("🧠 meetingMinutes state updated");
    })
    .catch(err => {
      console.error("❌ Error fetching meeting minutes");

      if (err.response) {
        console.error("📛 Status:", err.response.status);
        console.error("📛 Data:", err.response.data);
      } else if (err.request) {
        console.error("📡 No response received:", err.request);
      } else {
        console.error("⚙️ Axios config error:", err.message);
      }
    });
};

useEffect(() => {
  console.log("🔁 useEffect triggered → fetching meeting minutes");
  fetchMeetingMinutes();
}, []);


  
const handleScheduleRequest = () => {
  if (!schClass || !schSection || !schDate || !schTime) {
    setPopup({
      message: "Kindly fill in all fields to submit the schedule request.",
      type: "error"
    });
    return;
  }

  const schoolCode = localStorage.getItem('schoolCode');

  axios.post('https://cleezoclass.com:4000/api/schedule', {
    class: schClass,
    section: schSection,
    date: schDate,
    time: schTime,
    schoolCode
  })
  .then(res => {
    if (res.data.success) {
      setPopup({
        message: "✅ Schedule request has been successfully saved!",
        type: "success"
      });
      setSchClass('');
      setSchSection('');
      setSchDate('');
      setSchTime('');
      logEventAction("Schedule fixed", `Class ${schClass}-${schSection} on ${schDate} ${schTime}`);
    }
  })
  .catch(err => {
    console.error("Error saving schedule:", err);
    setPopup({
      message: "❌ Error saving schedule. Please try again.",
      type: "error"
    });
  });
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
const [indCurriculumList, setIndCurriculumList] = useState([]);
const [indSelectedCurriculum, setIndSelectedCurriculum] = useState("");
const [grpCurriculumList, setGrpCurriculumList] = useState([]);
const [grpSelectedCurriculum, setGrpSelectedCurriculum] = useState("");

const fetchIndCurriculum = async (className, section) => {
  try {
    const schoolCode = localStorage.getItem('schoolCode');
    const res = await axios.get(
      `https://cleezoclass.com:4000/api/admin/curriculum/${className}/${section}`,
      { params: { schoolCode } }
    );
    setIndCurriculumList(res.data || []);
  } catch {
    setIndCurriculumList([]);
  }
};
useEffect(() => {
  setIndCurriculumList([]);
  setIndSelectedCurriculum("");
  if (indClass && indSection) {
    fetchIndCurriculum(indClass, indSection);
  }
}, [indClass, indSection]);
useEffect(() => {
  setGrpCurriculumList([]);
  setGrpSelectedCurriculum("");
  if (grpClass && grpSection) {
    fetchGrpCurriculum(grpClass, grpSection);
  }
}, [grpClass, grpSection]);

const fetchGrpCurriculum = async (className, section) => {
  try {
    const schoolCode = localStorage.getItem('schoolCode');
    const res = await axios.get(
      `https://cleezoclass.com:4000/api/admin/curriculum/${className}/${section}`,
      { params: { schoolCode } }
    );
    setGrpCurriculumList(res.data || []);
  } catch {
    setGrpCurriculumList([]);
  }
};

  // SCHOOL CODE INCLUDED HERE
  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode');
    const params = { params: { schoolCode } };

    // Pass schoolCode in params for GET requests
    axios.get('https://cleezoclass.com:4000/api/party1', params).then(res => setParty1List(res.data));
    axios.get('https://cleezoclass.com:4000/api/classes', params).then(res => setClasses(res.data));
    fetchChatRequests();
    fetchHolidays(); // FETCH HOLIDAYS ON MOUNT
  }, []);

  // FIX: Watch all class states for fetching sections - SCHOOL CODE INCLUDED HERE
  useEffect(() => {
    let classToFetch = indClass || grpClass || schClass;
    const schoolCode = localStorage.getItem('schoolCode');
    
    if (classToFetch) {
      // Pass schoolCode as a query parameter
      axios.get(`https://cleezoclass.com:4000/api/sections/${classToFetch}`, { params: { schoolCode } })
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


  // SCHOOL CODE INCLUDED HERE
  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode');

    if (indClass && indSection) {
      // Pass schoolCode as a query parameter
      axios.get(`https://cleezoclass.com:4000/api/admin/students/${indClass}/${indSection}`, { params: { schoolCode } }).then(res => setStudents(res.data));
      setIndStudent('');
    }
  }, [indClass, indSection]);

  // SCHOOL CODE INCLUDED HERE
useEffect(() => {
  const schoolCode = localStorage.getItem('schoolCode');

  console.log("📦 Fetching chat sessions");
  console.log("🏫 schoolCode from localStorage:", schoolCode);

  axios.get(
    "https://cleezoclass.com:4000/api/chat_requests/sessions",
    { params: { schoolCode } }
  )
    .then(res => {
      console.log("✅ Sessions API response:", res.data);
      setSessionIds(res.data);
    })
    .catch(err => {
      console.error("❌ Error fetching sessions:", err);

      if (err.response) {
        console.error("🔴 Server response:", err.response.data);
        console.error("🔴 Status code:", err.response.status);
      } else if (err.request) {
        console.error("🟠 No response received:", err.request);
      } else {
        console.error("⚠️ Request setup error:", err.message);
      }
    });
}, []);

  // SCHOOL CODE INCLUDED HERE
  const fetchChatRequests = () => {
    const schoolCode = localStorage.getItem('schoolCode');
    axios.get('https://cleezoclass.com:4000/api/chat-requests', { params: { schoolCode } })
      .then(res => {
        const removedIds = getRemovedIds();
        setChatRequests(res.data.filter(req => !removedIds.includes(req.id)));
      });
  };

  // SCHOOL CODE INCLUDED HERE
const handleIndividualChat = () => {
  if (!indParty1 || !indClass || !indSection || !indStudent) {
    setPopup({
      message: "Kindly fill in all fields to submit the schedule request.",
      type: "error"
    });
    return;
  }

  const party1Obj = party1List.find(p => p.name === indParty1);
  const schoolCode = localStorage.getItem('schoolCode');

  axios.post('https://cleezoclass.com:4000/api/chat-request', {
    party1_id: party1Obj.id,
    party1_name: party1Obj.name,
    party2_class: indClass,
    party2_section: indSection,
    party2_student: indStudent,
    date: indDate,
    time: indTime,
    schoolCode // Include school code in the body
  }).then(res => {
    if (res.data.success) {
      setPopup({
        message: "✅ Individual chat request has been successfully saved!",
        type: "success"
      });
      setIndParty1('');
      setIndClass('');
      setIndSection('');
      setIndStudent('');
      setIndDate('');
      setIndTime('');
      fetchChatRequests();
      logEventAction("Individual chat fixed", `${indParty1} with ${indStudent} (${indClass}-${indSection})`);
    }
  }).catch(err => {
    console.error("Error saving chat request:", err);
    setPopup({
      message: "❌ Error saving chat request. Please try again.",
      type: "error"
    });
  });
};

const [activeAction, setActiveAction] = useState({
  id: null,
  type: null // 'edit' | 'delete'
});

  // SCHOOL CODE INCLUDED HERE
const handleGroupChat = () => {
  if (!grpParty1 || !grpClass || !grpSection) {
    setPopup({
      message: "Kindly fill in all fields to submit the schedule request.",
      type: "error"
    });
    return;
  }

  const party1Obj = party1List.find(p => p.name === grpParty1);
  const schoolCode = localStorage.getItem('schoolCode');

  axios.post('https://cleezoclass.com:4000/api/chat-request', {
    party1_id: party1Obj.id,
    party1_name: party1Obj.name,
    party2_class: grpClass,
    party2_section: grpSection,
    party2_student: null,
    date: grpDate,
    time: grpTime,
    schoolCode // Include school code in the body
  }).then(res => {
    if (res.data.success) {
      setPopup({
        message: "✅ Group chat request has been successfully saved!",
        type: "success"
      });
      setGrpParty1('');
      setGrpClass('');
      setGrpSection('');
      setGrpDate('');
      setGrpTime('');
      fetchChatRequests();
      logEventAction("Group chat fixed", `${grpParty1} for ${grpClass}-${grpSection}`);
    }
  }).catch(err => {
    console.error("Error saving group chat request:", err);
    setPopup({
      message: "❌ Error saving group chat request. Please try again.",
      type: "error"
    });
  });
};


  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
const pendingApprovalsCount = chatRequests.length;
const complaintsCount = complaintActions.length;
const meetingsCount = meetingList.length;
const holidaysCount = holidaysList.length;
const clearEventActionHistory = () => setRecentEventActions([]);
const isLargeMonitor = window.innerWidth > 1440;


  return (
    <div className="event-container">
      <h1 className="footprintsinner">Operations - Events & Meetings</h1>

      <ScrollableSection height="83vh">
        {{
          firstSection: (
            <div className="event-flex-row-final" style={{paddingBottom:'50px'}}>
              {/* LEFT SIDE - CHAT SETUP & UTILITIES */}
<div className="event-left-container">

  {/* --- Row 1 --- */}
  <div className="event-row">
    {/* Individual Chat */}
    <div className="event-card">
      <div className="event-card-header">
        <div className="event-circle-icon"></div>
        <div className="section-header">Individual Chat Request</div>
      </div>
      <div className="event-chat-row">
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement" value={indParty1} onChange={e => setIndParty1(e.target.value)}>
            <option value="">Party 1</option>
            {party1List.map(p => (
              <option key={p.id} value={p.name}>{p.name} ({p.user_type})</option>
            ))}
          </select>
        </div>
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement" value={indClass} onChange={e => setIndClass(e.target.value)}>
            <option value="">Class</option>
            {classes.map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement" value={indSection} onChange={e => setIndSection(e.target.value)} disabled={!indClass}>
            <option value="">Section</option>
            {sections.map((sec, i) => <option key={i} value={sec}>{sec}</option>)}
          </select>
        </div>
    
       
      </div>
      <div className="event-chat-row event-chat-actions-row event-chat-actions-row-individual">
            <div className="expense-input-field">
          <select
            className="btn-dropdown-FeesManagement"
            value={indSelectedCurriculum}
            onChange={e => setIndSelectedCurriculum(e.target.value)}
            disabled={!indClass || !indSection || indCurriculumList.length === 0}
          >
            <option value="">Curriculum</option>
            {indCurriculumList.map((curr, i) => (
              <option key={i} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
         <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement" value={indStudent} onChange={e => setIndStudent(e.target.value)} disabled={!indClass || !indSection}>
            <option value="">Student</option>
            {students.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        </div>
              <div className="event-chat-row event-chat-actions-row event-chat-actions-row-individual">

        <div className="expense-input-field">
          <input type="date" className="btn-dropdown-FeesManagement" value={indDate} onChange={e => setIndDate(e.target.value)} />
        </div>
        <div className="expense-input-field">
          <input type="time" className="btn-dropdown-FeesManagement"value={indTime} onChange={e => setIndTime(e.target.value)} />
        </div>
        <button className="btn-solid" style={{marginLeft:'-14%'}}onClick={handleIndividualChat}>Fix</button>
      </div>
    </div>

    {/* Complaints */}
    <div className="event-card">
      <div className="event-card-header">
        <div className="event-circle-icon"></div>
        <div className="section-header">Complaints</div>
      </div>
      <div className="event-flex-column">
        <div className="event-flex-row">
                                          <div className="expense-input-field">

          <select className="btn-dropdown-FeesManagement" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
            <option value="">Session No:</option>
            {sessionIds.map((session) => (
              <option key={session.id} value={session.id}>{session.id}</option>
            ))}
            
          </select></div>
            <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement" value={complaintTo} onChange={(e) => setComplaintTo(e.target.value)}>
            <option value="">Complaint To:</option>
            {complaintReceivers.map((r, i) => (
              <option key={i} value={r}>{r}</option>
            ))}
          </select></div>
        </div>
        <div className="event-flex-row">
            <div className="expense-input-field">
    <select className="btn-dropdown-FeesManagement" value={indParty1} onChange={e => setIndParty1(e.target.value)}>
          <option value="">Party 1</option>
          {party1List.map(p => (
            <option key={p.id} value={p.name}>{p.name} ({p.user_type})</option>
          ))}
        </select>    </div>
  <div className="expense-input-field">
<textarea
  className="select-like-textarea"
  placeholder=" complaint"
  value={complaintText}
  onChange={(e) => setComplaintText(e.target.value)}
  style={{padding:'0', margin:'0'}}
/>
</div>

              <button className="btn-solid" style={{marginTop:'2px'}} onClick={handleSubmitComplaint}>
  Red Tag
</button>

        </div>
      </div>
    </div>
  </div>

  {/* --- Row 2 --- */}
  <div className="event-row">
    {/* Group Chat */}
    <div className="event-card">
      <div className="event-card-header">
        <div className="event-circle-icon"></div>
        <div className="section-header">Group Chat Request</div>
      </div>
      <div className="event-chat-row">
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement" value={grpParty1} onChange={e => setGrpParty1(e.target.value)}>
            <option value="">Party 1</option>
            {party1List.map(p => <option key={p.id} value={p.name}>{p.name} ({p.user_type})</option>)}
          </select>
        </div>
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement" value={grpClass} onChange={e => setGrpClass(e.target.value)}>
            <option value="">Class</option>
            {classes.map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement" value={grpSection} onChange={e => setGrpSection(e.target.value)} disabled={!grpClass}>
            <option value="">Section</option>
            {sections.map((sec, i) => <option key={i} value={sec}>{sec}</option>)}
          </select>
        </div>
    
      </div>

      {grpClass && grpSection && grpCurriculumList.length === 0 && (
        <small style={{ color: "red" }}>
          No curriculum assigned for this class & section
        </small>
      )}

      <div className="event-chat-row event-chat-actions-row">
            <div className="expense-input-field">
          <select
            className="btn-dropdown-FeesManagement"
            value={grpSelectedCurriculum}
            onChange={(e) => setGrpSelectedCurriculum(e.target.value)}
            disabled={!grpClass || !grpSection || grpCurriculumList.length === 0}
          >
            <option value="">Curriculum</option>
            {grpCurriculumList.map((curr, i) => (
              <option key={i} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        <div className="expense-input-field">
          <input type="date" className="btn-dropdown-FeesManagement" value={grpDate} onChange={e => setGrpDate(e.target.value)} />
        </div>
        <div className="expense-input-field">
          <input type="time" className="btn-dropdown-FeesManagement"value={grpTime} onChange={e => setGrpTime(e.target.value)} />
        </div>
        <button className="btn-solid" onClick={handleGroupChat}>Fix</button>
      </div>
    </div>

    {/* Customize Chat */}
    <div className="event-card">
      <div className="event-card-header">
        <div className="event-circle-icon"></div>
        <div className="section-header">Customize Chat</div>
      </div>
      <p className="event-text">Add custom settings or predefined topics here.</p>
      <div className="event-flex-row">
        <button className="btn-solid">Topic 1</button>
        <button className="btn-solid">Topic 2</button>
      </div>
    </div>
  </div>

</div>


              {/* RIGHT SIDE - CHAT REQUESTS */}
              <div className="Card-rightContainer">
                <div className="event-actions-panel">
                  <div className="event-actions-header">
                    Actions ({pendingApprovalsCount + complaintsCount + recentEventActions.length})
                  </div>
                  <div className="event-actions-grid">
                    <div className="event-action-card">
                      <div className="event-action-title">Pending Chat Approvals</div>
                      <div className="event-action-value">{pendingApprovalsCount}</div>
                    </div>
                    <div className="event-action-card">
                      <div className="event-action-title">Complaints</div>
                      <div className="event-action-value">{complaintsCount}</div>
                    </div>
                    <div className="event-action-card">
                      <div className="event-action-title">Meetings</div>
                      <div className="event-action-value">{meetingsCount}</div>
                    </div>
                    <div className="event-action-card">
                      <div className="event-action-title">Holidays</div>
                      <div className="event-action-value">{holidaysCount}</div>
                    </div>
                  </div>
                  <div className="event-actions-quick">
                    <button
                      className="btn-outline"
                      onClick={() => {
                        fetchChatRequests();
                        logEventAction("Actions refreshed", "Chat requests reloaded");
                      }}
                    >
                      Refresh Requests
                    </button>
                    <button className="btn-outline" onClick={fetchMeetingMinutes}>View Minutes</button>
                    <button className="btn-outline" onClick={clearEventActionHistory}>Clear History</button>
                  </div>
                </div>
                <table className="event-table">
                  <tbody>
                    {chatRequests.map(req => (
                      <tr key={`chat-${req.id}`} className="event-table-row event-chat-pending-row" style={{border:'none'}} onClick={() => setExpandedId(req.id)}>
                        <td>
                          <div className="event-flex-row1 event-chat-pending-title">
                            <FontAwesomeIcon icon={faArrowRight} className="event-arrow-icon" />
                            Chat Approval Pending
                          </div>
                          <div className="event-flex-row event-chat-pending-content">
                            <div>
                              <strong>Session ID:</strong> {req.id || '-'}
                            </div>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                addRemovedId(req.id);
                                alert(`Approval sent to Chief for ID ${req.id}`);
                                setChatRequests(prev => prev.filter(r => r.id !== req.id));
                                logEventAction("Approval sent", `Chief approval sent for Session ID ${req.id}`);
                              }}
                              className="btn-solid" style={{marginTop:'5px'}}
                            >
                              Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {complaintActions.map(action => (
                      <tr key={`complaint-${action.id}`} className="event-table-row" style={{border:'none'}}>
                        <td>
                          <div className="event-complaint-title">Chat Complaint Filed</div>
                          <div className="event-flex-row">
                            <div>
                              <strong>Session ID:</strong> {action.sessionId}
                            </div>
                            <button
                              onClick={() => {
                                alert(`Complaint for Session ID ${action.sessionId} marked as resolved`);
                                logEventAction("Complaint resolved", `Session ID ${action.sessionId}`);
                              }}
                              className="btn-solid"
                            >
                              Resolve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="event-actions-recent">
                  <div className="event-actions-subheader">Recent Actions ({recentEventActions.length})</div>
                  {recentEventActions.length === 0 ? (
                    <div className="event-actions-empty">No recent actions</div>
                  ) : (
                    recentEventActions.slice(0, 6).map((a) => (
                      <div key={a.id} className="event-recent-card">
                        <div className="event-recent-title">{a.title}</div>
                        <div className="event-recent-detail">{a.detail}</div>
                        <div className="event-recent-time">{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
                {expandedId && (
                  <div className="event-modal">
                    <div className="event-modal-content">
                      {chatRequests.filter(r => r.id === expandedId).map(req => (
                        <div key={req.id}>
                          <h3>Chat Request Details (ID: {req.id})</h3>
                          <div>
                            <strong>Party 1:</strong> {req.party1_name}
                          </div>
                          <div className="event-flex-row">
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
                          <div className="event-flex-row">
                            <div>
                              <strong>Date:</strong> {req.date ? new Date(req.date).toLocaleDateString() : '-'}
                            </div>
                            <div>
                              <strong>Time:</strong> {req.time || '-'}
                            </div>
                          </div>
                          <button onClick={() => setExpandedId(null)} className="btn-solid">
                            Close
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ),
          secondSection: (
            <div>
                             <div className="footprintsinner" style={{ marginTop: '10px' }}>
         Operations – Academic – Staff
       </div>
            <div className="event-flex-row-final"  style={{paddingTop:'40px'}}>
              
              {/* LEFT SIDE - Schedule & Minutes */}
              <div
                className="event-left-container"
                style={{
                  borderLeft: '1px solid #ccc',
                  borderRight: '1px solid #ccc',
                  padding: '0 10px'
                }}
              >
                {/* Schedule Request */}
                  <div className="event-row">

                <div className="event-card">
                  <div className="event-card-header">
                    <div className="event-circle-icon"></div>
                    <div className="section-header">Schedule Request</div>
                  </div>
                  <div className="event-flex-row" style={{justifyContent: 'flex-start', width: '200px', gap: '10px'}}>
                   
                     <div className="expense-input-field">
                    <select className="btn-dropdown-FeesManagement" style={{width:'150px'}} value={schClass} onChange={(e) => setSchClass(e.target.value)}>
                      <option value="">Class</option>
                      {classes.map((cls, i) => (
                        <option key={i} value={cls}>{cls}</option>
                      ))}
                    </select></div>  <div className="expense-input-field">
                    <select className="btn-dropdown-FeesManagement" style={{width:'130px'}} value={schSection} onChange={(e) => setSchSection(e.target.value)} disabled={!schClass}>
                      <option value="">Section</option>
                      {sections.map((sec, i) => (
                        <option key={i} value={sec}>{sec}</option>
                      ))}
                    </select></div>
                  </div>
                  <div className="event-flex-row" >
                    <div className="expense-input-field"> <input type="date" className="btn-dropdown-FeesManagement" style={{marginTop:'20px'}} value={schDate} onChange={(e) => setSchDate(e.target.value)} />
              </div>  <div className="expense-input-field">      <input type="time" className="btn-dropdown-FeesManagement"   style={{marginTop:'20px'}} value={schTime} onChange={(e) => setSchTime(e.target.value)} />
                          </div>            <button className="btn-solid" onClick={handleScheduleRequest}>Fix</button>

                  </div>
                </div>

                {/* Agenda & Minutes */}
                <div className="event-card">
                  <div className="event-card-header">
                    <div className="event-circle-icon"></div>
                    <div className="section-header">Agenda & Minutes</div>
                  </div>
                  <div className="event-flex-row" >
                      <div className="expense-input-field">
                    <select
                      className="btn-dropdown-FeesManagement "
                      style={{ width: '100px', minWidth: '100px' }}
                      value={meetingNo}
                      onChange={(e) => setMeetingNo(e.target.value)}
                    >
                      <option value="">Meeting No</option>
                      {meetingList.map((m) => (
                        <option key={m.id} value={m.id}>{m.id}</option>
                      ))}
                    </select></div>
                      <div className="expense-input-field">
                    <input type="text" className="btn-dropdown-FeesManagement" placeholder="New Agenda Item" value={newAgendaItem} onChange={e => setNewAgendaItem(e.target.value)} />
              </div>    </div>
                  <div className="event-flex-row">
                    <button className="btn-solid" onClick={handleAddAgenda}>Add</button>
                    <button className="btn-solid">Schedule</button>
                  </div>
                </div>
</div>
                  <div className="event-row">

                {/* Add Agenda / Minutes Upload */}
     <div className="event-card" style={{ width: "200px" }}>
  <div className="event-card-header">
    <div className="event-circle-icon"></div>
    <div className="section-header">
      Add Agenda / Minutes Upload
    </div>
  </div>

  {/* Meeting Selection */}
  <div className="event-flex-row">
      <div className="expense-input-field">
    <select
 className="btn-dropdown-FeesManagement small-dropdown"
                      style={{ width: '100px', minWidth: '100px' }}      value={meetingNo}
      onChange={(e) => setMeetingNo(e.target.value)}
    >
      <option value="">Meeting No</option>
      {meetingList.map((m) => (
        <option key={m.id} value={m.id}>
          {m.id}
        </option>
      ))}
    </select></div>
  </div>

  {/* File Upload */}
  <div className="event-flex-row">
      <div className="expense-input-field">
    <input
      type="file"
      id="minutes-upload"
      style={{ marginTop: "60px" , display: "none",}}
      onChange={(e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileToUpload(file);
        handleUploadMinutes(file); // ✅ NO state timing issue
      }}
    /></div>

    <label htmlFor="minutes-upload" className="btn-outline">
      {fileToUpload
        ? fileToUpload.name.substring(0, 12) + "..."
        : "Choose File"}
    </label>
  </div>

  {/* Actions */}
  <div className="event-flex-row">
    <button className="btn-outline" onClick={() => setShowModal(true)}>
      Edit
    </button>
    <button className="btn-outline" onClick={() => setShowModal(true)}>
      Delete
    </button>
  </div>
</div>

                {/* Report */}
                <div className="event-card"style={{width:'200px'}}>
                  <div className="event-card-header">
                    <div className="event-circle-icon"></div>
                    <div className="section-header">Report</div>
                  </div>
                  <div className="event-flex-row">
                      <div className="expense-input-field">
                    <select  className="btn-dropdown-FeesManagement small-dropdown"
                      style={{ width: '100px', minWidth: '100px' }} value={selectedReportMeeting} onChange={(e) => setSelectedReportMeeting(e.target.value)}>
                      <option value="">Meeting No</option>
                      {meetingList.map((m, i) => (
                        <option key={i} value={m.id}>{m.id}</option>
                      ))}
                    </select></div>
                  </div>
                  <div className="event-flex-row">
                    <button className="btn-solid">Generate</button>
                    <button className="btn-solid">View</button>
                    <button className="btn-solid">Download</button>
                  </div>
                </div>
              </div>
              </div>

              {/* RIGHT SIDE - Festival / Holiday Actions */}
              <div className="Card-rightContainer">
                {/* Festival/Holiday Card */}
                <div className="event-card">
                  <div className="event-card-header">
                    <div className="event-circle-icon"></div>
                    <div className="section-header">Festival/Holiday</div>
                  </div>
                  <div className="event-flex-row">
                      <div className="expense-input-field">
                    <select className="btn-dropdown-FeesManagement" value={selectedEvent?.id || ''} onChange={handleEventChange}>
                      <option value="">Select Event</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>{event.event_name}</option>
                      ))}
                    </select></div>
                  </div>
                  <div className="event-flex-row">
                    <button className="btn-solid" onClick={handleGenerateManual}>Generate</button>
                    <button className="btn-solid" onClick={handleEditFestival}>Edit Festival</button>
                    <button className="btn-solid" onClick={handleDeleteFestival}>Delete Festival</button>
                  </div>
                  {eventDetails && (
                    <div className="event-details">
                      <h2>Event Details</h2>
                      <h3>{eventDetails.event_name}</h3>
                      {eventDetails.title && (
                        <p><strong>Title:</strong> {eventDetails.title}</p>
                      )}
                      {eventDetails.description && (
                        <p><strong>Description:</strong> {eventDetails.description}</p>
                      )}
                      {eventDetails.image && (
                        <div>
                          <img src={`data:image:jpeg;base64,${eventDetails.image}`} alt={eventDetails.event_name} />
                          <button onClick={() => handleImageDownload(eventDetails.image)} className="event-download-btn">Download Image</button>
                        </div>
                      )}
                    </div>
                  )}
                  {isLoading && <p>Loading...</p>}
                  {error && <p className="event-error">{error}</p>}
                </div>

                {/* Add Holiday Card */}
                <div className="event-card">
                  <div className="event-card-header">
                    <div className="event-circle-icon"></div>
                    <div className="section-header">Add Holiday</div>
                  </div>
                  <div className="event-flex-row">
                      <div className="expense-input-field">
                    <input type="date" className="btn-dropdown-FeesManagement" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} />
                  </div>  <div className="expense-input-field">  <input type="text" className="btn-dropdown-FeesManagement" placeholder="Holiday Name" value={holidayName} onChange={e => setHolidayName(e.target.value)} />
               </div>     <button className="btn-solid" style={{marginTop:'1px'}} onClick={handleSendHoliday}>Send</button>
                  </div>
                  <div className="event-flex-row">
                      <div className="expense-input-field">
                    <select className="btn-dropdown-FeesManagement" value={selectedHoliday} onChange={e => setSelectedHoliday(e.target.value)}>
                      <option value="">Select Holiday</option>
                      {holidaysList.map((h) => (
                        <option key={h.id} value={h.id}>{h.name} - {h.date}</option>
                      ))}
                    </select></div>
                    <button className="btn-solid" style={{marginTop:'0px'}} onClick={handleDeleteHoliday}>Delete</button>
                  </div>
                </div>
              </div>



            </div>
            </div>
          )
        }}


      </ScrollableSection>
      <ErrorPopup
  message={popup.message}
  type={popup.type}
  onClose={() => setPopup({ message: "", type: "" })}
/>

    </div>
  );
};
export default ChatOperations;