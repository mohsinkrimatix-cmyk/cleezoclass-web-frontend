import React, { useState, useEffect } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookReader,
  faUserCheck,
  faTrophy,
  faChalkboardTeacher,
  faBookmark,
  faMoneyCheckAlt
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import ErrorPopup from "../shared/ErrorPopup";

// --- Configuration ---
const API_BASE_URL = 'https://cleezoclass.com:5000/api';
// Assuming the backend for 'AssignSubstitute.jsx' uses https://cleezoclass.com:5000
// const ABSENT_TEACHERS_API = 'https://cleezoclass.com:5000/api/absent-teachers'; 
// For production consistency, we'll try to use the configured base URL path.
const ABSENT_TEACHERS_API = `${API_BASE_URL.replace(':5000/api', ':5000')}/api/chief/absent-teachers`;

const mockDropdowns = {
  classes: [
    "Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"
  ],
  sections: ['A', 'B', 'C'],
};

export default function TimetableChief() {
  // ------------------------------
    const [popupMessage, setPopupMessage] = useState("");

  // COMMON STYLES
  // ------------------------------
  const outerContainer = { width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start", background: "#f7f7f7",  minHeight: "70vh", padding: "5px", boxSizing: "border-box" };
  const innerContainer = { width: "100%", maxWidth: "1000px", display: "flex", gap: "5px", padding: "10px", background: "#fff", borderRadius: "6px", boxShadow: "0px 1px 5px rgba(0,0,0,0.1)", margin: "10px auto" };
  const headingStyle = { position: "absolute", top: "10px", fontSize: "16px", fontWeight: "600", textAlign: "center", width: "100%" };
  const leftColumn = { flex: 1, display: "flex", flexDirection: "column", gap: "5px" };
  const cardLarge = { background: "#fff", padding: "8px", borderRadius: "6px", boxShadow: "0px 1px 4px rgba(0,0,0,0.08)", flex: 1, display: "flex", flexDirection: "column" };
  const boxStyle = { flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "130px", margin: "0 2px" };
  const boxStyleSmall = { ...boxStyle, height: "80px" };
  const iconStyle = { fontSize: "16px", marginBottom: "3px", color: "#000" };
  const btnStyle = { padding: "3px 6px", borderRadius: "3px", border: "none", cursor: "pointer", background: "rgba(158, 165, 172, 1)", color: "#fff", fontSize: "10px", marginTop: "3px" };
  const buttonStyle = { padding: "3px 6px", cursor: "pointer", fontSize: "10px", border: "1px solid #555", borderRadius: "3px", background: "#f1f1f1" };
const thStyle = {
  background: "#f3f3f3",
  padding: "10px",
  textAlign: "center",     // <-- TH CENTERED
  fontWeight: "bold",
  fontSize: "13px",
  borderBottom: "1px solid #ccc", // bottom line
  borderRight: "1px solid #ccc"   // right line
};

const tdStyle = {
  padding: "10px",
  textAlign: "center",     // <-- TD CENTERED
  fontSize: "13px",
  borderBottom: "1px solid #ccc", // bottom border
  borderRight: "1px solid #ccc"   // right border
};

  // ------------------------------
  // STATE & NAVIGATION
  // ------------------------------
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedClass, setSelectedClass] = useState("1");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [activeView, setActiveView] = useState('class');
  const [classSubjectStats, setClassSubjectStats] = useState([]);
  const [teacherSchedule, setTeacherSchedule] = useState({
    dayClassCounts: [],
    classPeriodCounts: [],
    schedule: [],
  });
  const [loading, setLoading] = useState(false);
  const [showTeacherSearch, setShowTeacherSearch] = useState(false);
  const [timetableRows, setTimetableRows] = useState(0);
  const [totalSubstitutes, setTotalSubstitutes] = useState(0); // NEW STATE FOR SUBSTITUTE COUNT
  const navigate = useNavigate();
  const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"];

  // Transform API response for teacher schedule
  const transformTeacherSchedule = (apiData) => {
    console.log("Raw API Data:", apiData); // Debug: Log raw API data

    // Group by day
    const scheduleByDay = apiData.reduce((acc, slot) => {
      if (!acc[slot.day]) {
        acc[slot.day] = [];
      }
      acc[slot.day].push(slot);
      return acc;
    }, {});

    // Extract unique days and count classes per day
    const days = Object.keys(scheduleByDay);
    const dayClassCounts = days.map((day) => ({
      day,
      classCount: scheduleByDay[day].length,
    }));

    // Extract unique classes and count periods per class
    const classes = [...new Set(apiData.map((slot) => slot.class_id))];
    const classPeriodCounts = classes.map((classId) => ({
      class: classId,
      periodCount: apiData.filter((slot) => slot.class_id === classId).length,
    }));

    // Format the schedule for the table
    const schedule = apiData.map((slot) => ({
      day: slot.day,
      class: slot.class_id,
      subject: slot.subject || "N/A",
      time: slot.morning_interval_time || "N/A",
    }));

    console.log("Transformed Data:", { dayClassCounts, classPeriodCounts, schedule }); // Debug: Log transformed data

    return {
      dayClassCounts,
      classPeriodCounts,
      schedule,
    };
  };

useEffect(() => {
  const fetchAbsentTeacherCount = async () => {
    try {
      const schoolCode = localStorage.getItem("schoolCode") || "";  
      const apiUrl = `${ABSENT_TEACHERS_API}?schoolCode=${schoolCode}`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // FIX: Convert object-with-numeric-keys into array
      const finalData = Array.isArray(data) ? data : Object.values(data);

      setAbsentTeachers(finalData);     // <-- NOW it stores correctly
      setTotalSubstitutes(finalData.length);

    } catch (error) {
      console.error("Error fetching absent teacher count:", error);
      setTotalSubstitutes("Err");
    }
  };

  fetchAbsentTeacherCount();
}, []);



  useEffect(() => {
    if (selectedClass && selectedSection) {
      const fetchTeachers = async () => {
        try {
          const schoolCode = localStorage.getItem("schoolCode");
          const teachersResponse = await fetch(`${API_BASE_URL}/class-teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              classId: selectedClass,
              sectionId: selectedSection,
              schoolCode,
            }),
          });
          const teachersData = await teachersResponse.json();
          setTeachers(teachersData);
        } catch (error) {
          console.error("Error fetching teachers:", error);
        }
      };
      fetchTeachers();
    }
  }, [selectedClass, selectedSection]);

  // Load default Class Stats on mount
  useEffect(() => {
    handleSearch('Class', selectedClass, selectedSection);
  }, []);

  const handleView = (type) => {
    if (type === "Substitutes") {
        // Navigate to the route that renders AssignSubstitute.jsx
        // You MUST set up a route in your app's router (e.g., App.js) for this.
        navigate("/assign-substitute"); 
    } else {
        setPopupMessage(`View details for: ${type}`);
    }
  };
const [showPopup, setShowPopup] = useState(false);
const [absentTeachers, setAbsentTeachers] = useState([]);

  const handleSearch = async (type, value1, value2) => {
    setLoading(true);
    setClassSubjectStats([]);
    setTeacherSchedule({ dayClassCounts: [], classPeriodCounts: [], schedule: [] });
    const schoolCode = localStorage.getItem("schoolCode");
    let endpoint = '';
    let body = {};

    if (type === 'Class') {
      endpoint = '/class-stats';
      body = {
        classId: value1,
        sectionId: value2,
        schoolCode,
      };
      setActiveView('class');
      setShowTeacherSearch(false);
    } else if (type === 'Teacher') {
      endpoint = '/teacher-schedule';
      body = {
        teacherName: value1,
        schoolCode,
      };
      setActiveView('teacher');
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("API Response:", data); // Debug: Log API response

      if (type === 'Class') {
        setClassSubjectStats(data);
      } else if (type === 'Teacher') {
        const transformedData = transformTeacherSchedule(data);
        setTeacherSchedule(transformedData);
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      setPopupMessage(`Failed to fetch ${type} data. Check console for details.`);
      if (type === 'Class') setClassSubjectStats([]);
      if (type === 'Teacher') setTeacherSchedule({ dayClassCounts: [], classPeriodCounts: [], schedule: [] });
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // CONDITIONAL RENDERING FUNCTIONS
  // ------------------------------
  const renderClassStats = () => {
    const freePeriodKeywords = ['Free', 'Break', 'N/A', 'Library', 'Lunch', 'Sports'];
    const filteredStats = classSubjectStats.filter(stat =>
      !freePeriodKeywords.some(keyword =>
        stat.subject && stat.subject.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    return (
      <>
        <div style={{ padding: '4px 0', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
          Class {selectedClass} | Section {selectedSection}
        </div>
        {loading ? (
          <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '50px', color: '#777' }}>Loading class statistics...</p>
        ) : filteredStats.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px", marginTop: '8px' }}>
            {filteredStats.map((stat, index) => (
              <div key={index} style={boxStyleSmall}>
                <h4 style={{ fontSize: "11px", margin: "0 0 2px 0", color: '#3498db' }}>{stat.subject}</h4>
                <p style={{ fontSize: "11px", fontWeight: "bold", margin: "0 0 2px 0" }}>{stat.periodsPerWeek} Periods per Week</p>
                <p style={{ fontSize: "10px", margin: "0", fontWeight: "bold" }}>Teacher: {stat.teacherName || 'N/A'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '50px', color: '#777' }}>
            {classSubjectStats.length > 0 ? 'Only non-academic periods found for this Class/Section.' : 'No subjects found for this Class/Section.'}
          </p>
        )}
      </>
    );
  };

  const renderTeacherSchedule = () => {
    const { dayClassCounts, classPeriodCounts, schedule } = teacherSchedule;

    return (
      <>
        <div style={{ padding: '4px 0', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
          Schedule for Teacher: {selectedTeacher || 'N/A'}
        </div>
        {loading ? (
          <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '50px', color: '#777' }}>Loading teacher schedule...</p>
        ) : (
          <>
            {/* Number of classes per day */}
            {dayClassCounts && dayClassCounts.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ fontSize: '12px', marginBottom: '5px' }}>Classes per Day:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                  {dayClassCounts.map((dayCount, index) => (
                    <div key={index} style={{ fontSize: '10px', padding: '3px', border: '1px solid #ccc', borderRadius: '3px', textAlign: 'center' }}>
                      <p style={{ margin: '0', fontWeight: 'bold' }}>{dayCount.day}</p>
                      <p style={{ margin: '0' }}>{dayCount.classCount} class(es)</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Number of periods per class */}
            {classPeriodCounts && classPeriodCounts.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ fontSize: '12px', marginBottom: '5px' }}>Periods per Class:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                  {classPeriodCounts.map((classPeriod, index) => (
                    <div key={index} style={{ fontSize: '10px', padding: '3px', border: '1px solid #ccc', borderRadius: '3px', textAlign: 'center' }}>
                      <p style={{ margin: '0', fontWeight: 'bold' }}>class {classPeriod.class}</p>
                      <p style={{ margin: '0' }}>{classPeriod.periodCount} period(s)</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher's actual schedule */}
            {schedule && schedule.length > 0 ? (
            null
            ) : (
              <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '20px', color: '#777' }}>No schedule data available.</p>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div style={outerContainer}>
      <h2 className="footprints">Timetable Generation</h2>
      <div style={innerContainer}>
        <div style={leftColumn}>
          {/* Top Card: Month Selection and 3 Boxes */}
          <div style={cardLarge}>
            <div style={{ marginBottom: "10px", textAlign: "right" }}>
              <select
                id="month"
                                        className="btn-dropdown"

                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Select Month</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
                <h4 style={{ margin: "0 0 3px 0", fontSize: "11px" }}>Total Timetables Generated</h4>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>88</p>
                <button data-guide="timetable-btn-generated-list"   className="btn-outline" style={{marginTop:'-2%'}}
 onClick={() => handleView("Generations")}>View List</button>
              </div>
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faUserCheck} style={iconStyle} />
                <h4 style={{ margin: "0 0 3px 0", fontSize: "11px" }}>Timetable Status</h4>
                <p style={{ fontSize: "14px", fontWeight: "bold", margin: "0", color: '#2ecc71' }}>Generated</p>
<button
  data-guide="timetable-btn-generate-timetable"
  className="btn-outline"
  onClick={() => navigate("/TimetableGeneration")}
>
  Generate Timetable
</button>

              </div>
              {/* UPDATED: Total Substitute Box */}
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faTrophy} style={iconStyle} />
                <h4 style={{ margin: "0 0 3px 0", fontSize: "11px" }}>Total Substitutes</h4>
                {/* Display the fetched count */}
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>{totalSubstitutes}</p>
                {/* Updated onClick to navigate to the substitute assignment page */}
<button
  data-guide="timetable-btn-substitutes-list"
  className="btn-outline"
  onClick={() => setShowPopup(true)}
>
  View List
</button>

              </div>
            </div>
          </div>
          {/* Bottom Card: Search/Stats section */}
          <div style={cardLarge}>
            <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "6px", padding: "10px", background: "#fcfcfc" }}>
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                {/* LEFT CONTAINER (3 Search Boxes) */}
                <div style={{ width: "30%", display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {/* Box 1: Search Teacher */}
                    <div style={{ ...boxStyle, height: '100px' }}>
                      <FontAwesomeIcon icon={faChalkboardTeacher} style={iconStyle} />
                      <h4 style={{ margin: "0 0 3px 0", fontSize: "12px" }}>Search Teacher</h4>
                      <button
                        className="btn-solid"
                         data-guide="timetable-btn-search-teacher"

                        onClick={() => setShowTeacherSearch(true)}
                      >
                        Search Teacher
                      </button>
                    </div>
                    {/* Box 2: Search Subject */}
                    <div style={{ ...boxStyle, height: '100px' }}>
                      <FontAwesomeIcon icon={faBookmark} style={iconStyle} />
                      <h4 style={{ margin: "0 0 3px 0", fontSize: "12px" }}>Search Subject</h4>
                      <button
                      data-guide="timetable-btn-subject-wise-data"
                        className="btn-solid"
                        onClick={() => selectedClass && selectedSection && handleSearch("Class", selectedClass, selectedSection)}
                        disabled={!selectedClass || !selectedSection || loading}
                      >
                        Shows Subject-wise Data
                      </button>
                    </div>
                    {/* Box 3 (Total Timetable Rows) */}
                    <div style={{ ...boxStyle, height: '100px' }}>
                      <FontAwesomeIcon icon={faMoneyCheckAlt} style={iconStyle} />
                      <h4 style={{ margin: "0 0 3px 0", fontSize: "12px" }}>Total Timetable Rows </h4>
                      <p style={{ fontSize: "30px", fontWeight: "400px", margin: "3px 0" }}>{timetableRows}</p>
                    </div>
                  </div>
                </div>
                {/* RIGHT CONTAINER (Dynamic Results View) */}
                <div style={{ width: "70%", display: "flex", flexDirection: "column", gap: "5px", backgroundColor: '#fff' }}>
                  {showTeacherSearch && (
                    <div style={{ marginBottom: "10px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}>
                      <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
                        <select
                          style={{ padding: "3px", width: "200px", fontSize: "11px" }}
                          value={selectedTeacher}
                          onChange={(e) => setSelectedTeacher(e.target.value)}
                        >
                          <option value="">Select Teacher</option>
                          {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                          style={{ ...btnStyle, background: 'rgba(158, 165, 172, 1)' }}
                          onClick={() => selectedTeacher && handleSearch("Teacher", selectedTeacher)}
                          disabled={!selectedTeacher || loading}
                        >
                          Show Schedule
                        </button>
                        <button
                          style={{ ...buttonStyle, width: "30px" }}
                          onClick={() => setShowTeacherSearch(false)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                  <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '8px', borderRadius: '4px', minHeight: '270px' }}>
                    {/* Class Dropdown Section */}
                    <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
                      <select
                                        className="btn-dropdown"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                      >
                        <option value="">Select Class</option>
                        {mockDropdowns.classes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select
                                        className="btn-dropdown"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                      >
                        <option value="">Select Section</option>
                        {mockDropdowns.sections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                      data-guide="timetable-btn-show-stats"
                        className="btn-solid"
                        onClick={() => selectedClass && selectedSection && handleSearch("Class", selectedClass, selectedSection)}
                        disabled={!selectedClass || !selectedSection || loading}
                      >
                        Show Stats
                      </button>
                    </div>
                    <hr style={{ margin: '5px 0', border: 'none', borderTop: '1px solid #eee' }} />
                    {/* Conditional Rendering of Results */}
                    {activeView === 'class' && renderClassStats()}
                    {activeView === 'teacher' && renderTeacherSchedule()}
                    {activeView === '' && (
                      <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '50px', color: '#777' }}>Select Class/Section or use search boxes on the left.</p>
                    )}
                  </div>
                  {/* Stats Boxes */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px", marginTop: "5px" }}>
                    <div style={boxStyleSmall}>
                      <p style={{ fontSize: "13px", fontWeight: "bold" }}>{teachers.length}</p>
                      <p style={{ fontSize: "13px", fontWeight: "bold" }}>Total Teachers</p>
                    </div>
                    <div style={boxStyleSmall}>
                      <p style={{ fontSize: "13px", fontWeight: "bold" }}>
                        {classSubjectStats.filter(stat =>
                          !['Free', 'Break', 'N/A', 'Library', 'Lunch', 'Sports'].some(keyword =>
                            stat.subject?.toLowerCase().includes(keyword.toLowerCase())
                          )
                        ).length}
                      </p>
                      <p style={{ fontSize: "13px", fontWeight: "bold" }}>Total Subjects</p>
                    </div>
                    <div style={boxStyleSmall}>
                       {/* Display the fetched count in the summary section too */}
                      <p style={{ fontSize: "13px", fontWeight: "bold" }}>{totalSubstitutes}</p>
                      <p style={{ fontSize: "13px", fontWeight: "bold" }}>Substitutes Today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
{showPopup && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  }}>
    <div style={{
      width: "420px",
      background: "#fff",
      borderRadius: "10px",
      padding: "20px",
      boxShadow: "0 3px 10px rgba(0,0,0,0.2)"
    }}>
      
      <h3 style={{ marginBottom: "10px", textAlign: "center" }}>
        Absent Teachers
      </h3>

      {absentTeachers.length === 0 ? (
        <p>No absent teachers found.</p>
      ) : (
        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Subject</th>
              </tr>
            </thead>
            <tbody>
              {absentTeachers.map((t, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={tdStyle}>{t.teacher_id}</td>
                  <td style={tdStyle}>{t.teacher_name}</td>
                  <td style={tdStyle}>{t.subject || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        style={{
          marginTop: "15px",
          width: "100%",
          padding: "8px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
        onClick={() => setShowPopup(false)}
      >
        Close
      </button>
    </div>
  </div>
)}


        </div>
      </div>
             <ErrorPopup
        message={popupMessage} 
        onClose={() => setPopupMessage("")} 
      />
    </div>
  );
}