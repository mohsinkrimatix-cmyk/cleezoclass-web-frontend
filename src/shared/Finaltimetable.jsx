import { useRef, useState ,useEffect} from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';import axios from "axios";
import { useNavigate } from "react-router-dom";import { Link } from 'react-router-dom';


import Extraactivityform from './Extraactivityform';

const TimetableGeneration = () => {
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [sections, setSections] = useState({});
  const [classTeachers, setClassTeachers] = useState({});
  const [timetable, setTimetable] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
const [startTime, setStartTime] = useState("08:00");
const [periodDuration, setPeriodDuration] = useState(40);
const [numberOfPeriods, setNumberOfPeriods] = useState(7);
  const [morningInterval, setMorningInterval] = useState(false);
  const [afternoonInterval, setAfternoonInterval] = useState(false);
  const [lunchTime, setLunchTime] = useState("12:30");
  const [lunchDuration, setLunchDuration] = useState(30); // Default lunch duration
  const [morningIntervalAfter, setMorningIntervalAfter] = useState("");
  const [morningIntervalDuration, setMorningIntervalDuration] = useState("");
  const [afternoonIntervalAfter, setAfternoonIntervalAfter] = useState("");
  const [afternoonIntervalDuration, setAfternoonIntervalDuration] = useState("");
  const [lunchInterval, setLunchInterval] = useState(false);
  const [lunchIntervalAfter, setLunchIntervalAfter] = useState(null);
  const [lunchIntervalDuration, setLunchIntervalDuration] = useState(null);
  
  const navigate = useNavigate();
    const [customActivities, setCustomActivities] = useState([]);
  const [scheduleSettings, setScheduleSettings] = useState({}); // your left form state
  

 const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();
 // Track which classes are being edited
const [editingClasses, setEditingClasses] = useState({});


  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);

  // State to store the dynamically loaded page content
  const [activeContent, setActiveContent] = useState(null);
 
 
  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };
 

 
  const handleGroupChartClick = () => {
    setActivePage('groupchart');
    setActiveContent(true);
  };
  const handleteacherstimetableClick = () => {
    setActivePage('timetable');
    setActiveContent(true);
  };
 
  const handlestaffperformanceClick = () => {
    setActivePage('staffperform');
    setActiveContent(true);
  };
  const handlesaccedamicmanagemenClick = () => {
    setActivePage('accdemic');
    setActiveContent(true);
  };
 
  const openCalendar = () => {
    dateInputRef.current?.showPicker();
  };
  const handleBackClick = () => {
    navigate('/timetable'); // Navigate to the "accdemic" route
  };
const [hover, setHover] = useState(false);
  const handleShare = async () => {
    const shareData = {
      title: 'Check this out!',
      text: 'Here is something worth sharing.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } else {
        alert('Web Share API not supported in this browser.');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };
  // The container click handler to update active content
  const handleContainerClick = (content) => {
    setActiveContent(content); // Update active content
  };

  // Function to download content as PDF
const dashboardRef = useRef(null);

  // Function to download content as PDF
const handleDownload = async () => {
  const input = dashboardRef.current;
  if (!input) return;

  // Step 1: Expand the element to full height temporarily
  const originalStyle = {
    height: input.style.height,
    overflow: input.style.overflow,
  };

  const fullHeight = input.scrollHeight;

  input.style.height = fullHeight + 'px';
  input.style.overflow = 'visible';

  // Allow time for rendering the expanded content
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Step 2: Take full screenshot
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      width: input.scrollWidth,
      height: input.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = 236; // A4
    const pageHeight = 297;
    const imgProps = pdf.getImageProperties(imgData);

    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('full-dashboard.pdf');
  } catch (error) {
    console.error('Error generating full PDF:', error);
  } finally {
    // Step 3: Restore original styles
    input.style.height = originalStyle.height;
    input.style.overflow = originalStyle.overflow;
  }
};
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };



  const classOptions = [
    "Nursery",
    "LKG",
    "UKG",
    ...Array.from({ length: 10 }, (_, i) => i + 1),
  ];
 

  const handleClassSelection = (className) => {
    setSelectedClasses((prev) =>
      prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className]
    );
  };

  const handleSectionChange = (className, sectionCount) => {
    const updatedSections = { ...sections, [className]: sectionCount || 1 };
    setSections(updatedSections);
    const calculatedRows = selectedClasses.reduce(
      (sum, className) => sum + (updatedSections[className] || 1),
      0
    );
    setTotalRows(calculatedRows);
  };





const handleSubmit = async (e) => {
  e.preventDefault();

  // 1️⃣ Read & validate school code
  const schoolCode = (localStorage.getItem("schoolCode") || "").trim();
  if (!schoolCode) {
    alert("School code missing in localStorage");
    return;
  }

  // 2️⃣ Build the request payload
  const payload = {
    schoolCode,
    classes: selectedClasses.map((name) => ({
      class_name: String(name).replace(/^Class\s+/i, ''),  
      sections: sections[name] || 1,
      teacher: classTeachers[name] || "Not Assigned",
    })),
    startTime,
    periodDuration,
    numberOfPeriods,
    morningInterval,
    morningIntervalAfter,
    morningIntervalDuration,
    afternoonInterval,
    afternoonIntervalAfter,
    afternoonIntervalDuration,
    lunchInterval,
    lunchIntervalAfter,
    lunchIntervalDuration,
    customActivities // ✅ Pass user-selected / typed activities
  };

  try {
    // 3️⃣ Send request to backend
    const { data } = await axios.post(
      "https://cleezoclass.com:4000/generatetimetable",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    // 4️⃣ Handle response
    if (data?.weeklyTimetable) {
      setTimetable(data.weeklyTimetable);
      console.log("Generated Timetable:", data.weeklyTimetable);
      alert("Timetable generated successfully!");
    } else {
      console.error("Unexpected response:", data);
      alert("Timetable generation failed. Check console for details.");
    }
  } catch (err) {
    console.error("❌ Server error:", err);
    alert("Server error — check console.");
  }
};



const handleEditClass = (className) => {
  setEditingClasses(prev => ({ ...prev, [className]: true }));
};

const handleSaveClass = (className) => {
  setEditingClasses(prev => ({ ...prev, [className]: false }));
  alert(`✅ Timetable for ${className} saved successfully!`);
};



 
 
const handleRemoveClass = (className) => {
  // --- Prompt for day ---
  let day = prompt("Enter the day to remove a period (or leave empty to delete the entire class):");
  if (day === null) return; // Cancel
  day = day.trim();

  if (!day) {
    // Remove the entire class
    setTimetable((prev) => {
      const updatedTimetable = { ...prev };
      delete updatedTimetable[className];
      return updatedTimetable;
    });
    return;
  }

  // --- Prompt for period number ---
  let periodNumber = prompt("Enter the period number to remove (1-10):");
  if (periodNumber === null) return;
  periodNumber = periodNumber.trim();

  if (periodNumber === "" || isNaN(periodNumber) || periodNumber < 1 || periodNumber > 10) {
    alert("Please enter a valid period number between 1 and 10.");
    return;
  }
  periodNumber = Number(periodNumber);

  // --- Mark that period as empty/free (do not delete index) ---
  setTimetable((prev) => {
    const updatedTimetable = { ...prev };

    Object.keys(updatedTimetable[className]).forEach((section) => {
      if (updatedTimetable[className][section][day]) {
        updatedTimetable[className][section][day][periodNumber - 1] = {
          period: periodNumber,
          subject: "—",   // blank or "Free Period"
          teacher: "—",   // blank teacher
          from_time: updatedTimetable[className][section][day][periodNumber - 1].from_time,
          to_time: updatedTimetable[className][section][day][periodNumber - 1].to_time,
          section
        };
      }
    });

    return updatedTimetable;
  });
};


  
 
useEffect(() => {
  const schoolCode = localStorage.getItem('schoolCode');
  console.log("we are getting here schoolCode")
  console.log(schoolCode)

  if (schoolCode) {
    console.log("here are passing schoolCode and sending request")
    //  axios.post('https://cleezoclass.com:4000app/school-init', { schoolCode })
    //  axios.post('https://cleezoclass.com:4000app/school-init', { schoolCode })
     axios.post('https://cleezoclass.com:4000app/school-init', { schoolCode })
      .then(res => console.log('✅ School initialized:', res.data))
      .catch(err => console.error('❌ School init failed:', err.response?.data || err.message));
  } else {
    console.warn('⚠️ No schoolCode found in localStorage');
  }
}, []);

    


useEffect(() => {
  const schoolCode = localStorage.getItem('schoolCode');
  fetch(`https://cleezoclass.com:4000app/getteacher?schoolCode=${encodeURIComponent(schoolCode)}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("📌 Teachers API Response:", data);
      // set some state with the list of teachers, e.g., setTeachers(data)
    })
    .catch((error) => console.error("Error fetching teachers:", error));
}, []);

 
    useEffect(() => {
      const total = Object.values(sections).reduce((acc, section) => acc + section, 0);
      setTotalRows(total);
    }, [sections]);
 
    // const handleSectionChange = (className, sectionCount) => {
    //   const updatedSections = { ...sections, [className]: sectionCount || 1 };
    //   setSections(updatedSections);
    // };
   

    const handleSectionChanged=(className,sectionCount)=>{
      const updatedSections={...sections, [className]:sectionCount || 1}
      setSections(updatedSections)
    }


 
 
  const containerStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  };

  const sectionStyle = {
    flex: 1,
    padding: "15px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    margin: "10px",
    backgroundColor: "#f9f9f9",
  };
  const sectionStyle1 = {
    flex: 1,
    padding: "15px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    margin: "10px",
    backgroundColor: "#f9f9f9",
    width:'80%'
  };

  const formContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  };
const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  backgroundColor: "rgba(15,150,128,255)",   // normal color
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  transition: "background-color 0.25s ease",
};

const linkStyle = {
  margin: "0 10px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center"
};

const iconStyle = {
  padding: "10px",
  borderRadius: "50%",
  fontSize: "25px",
  transition: "all 0.3s",
  width: "40px",
  height: "40px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};
  const userRole = localStorage.getItem('userRole');
  const inputStyle = {
    padding: "5px",
    margin: "5px 0",
    fontSize: "14px",
    width: "50px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  };

  const labelStyle = {
    marginBottom: "8px",
    fontWeight: "bold",
  };
 const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');

useEffect(() => {
  const fetchSchoolLogo = async () => {
    console.log('🚀 Starting logo fetch process...');

    const code = localStorage.getItem('schoolCode');
    console.log('🧾 localStorage.getItem("schoolCode") =', code, '| Type:', typeof code);

    if (!code) {
      console.warn('❌ No school code found in localStorage. Aborting fetch.');
      return;
    }

    setDynamicSchoolCode(code);
    console.log('📦 Set dynamic school code in state:', code);

    try {
      console.log('📡 Sending POST request to backend with secretecode...');
      const response = await axios.post(
        // 'https://cleezoclass.com:4000app/schoollogodynamic',
        'https://cleezoclass.com:4000app/schoollogodynamic',
        { secretecode: code },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📬 Response from backend:', response);
      console.log('📬 Response.data:', response.data);

      if (response.data.logoPath) {
        console.log('✅ Logo fetched successfully from backend.');
        setDynamicLogoSrc(response.data.logoPath);
      } else {
        console.warn('⚠️ No logo path found in backend response.');
      }
    } catch (error) {
      console.error('🔥 Error fetching school logo:', error.response?.data || error.message);
    }
  };

  fetchSchoolLogo();
}, []);
  return (
    <>
   <header style={{
  backgroundColor: '#fff',
  color: 'white',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  position: 'sticky',
  top: '0',
  zIndex: '50',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  position: 'relative'
}}>
  {/* Responsive styles via style tag */}
  <style>
    {`
      @media (max-width: 768px) {
        .header-logo {
          height: 50px !important;
          left: 1rem !important;
        }
        .header-title {
          font-size: 1rem !important;
          padding: 0 0.5rem !important;
        }
        .header-wrapper {
          padding: 0.5rem !important;
        }
      }

      @media (max-width: 480px) {
        .header-logo {
          height: 40px !important;
          left: 0.5rem !important;
        }
        .header-title {
          font-size: 0.9rem !important;
        }
      }
    `}
  </style>

  {/* Logo */}
  <img
    src={dynamicLogoSrc || "/default-logo.png"}
    alt="School Logo"
    className="header-logo"
    style={{
      height: '80px',
      width: 'auto',
      borderRadius: '1px',
      position: 'absolute',
      left: '3rem',
      top: '50%',
      transform: 'translateY(-50%)',
      paddingLeft: '1rem'
    }}
  />

  {/* Flex Wrapper */}
  <div
    className="header-wrapper"
    style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0.75rem 1rem',
      display: 'flex',
      justifyContent: 'center',
      position: 'relative'
    }}
  >
    <h1
      className="header-title"
      style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        margin: 0,
        whiteSpace: 'nowrap',
        color: 'black'
      }}
    >
      {dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL
    </h1>
  </div>
</header>

    <div className="outer-container">
 

      <div className="main-content">
                                                  <div ref={dashboardRef} style={{ overflowY: 'auto' }}>

    <div style={containerStyle}>
      <h2 style={{ textAlign: "center" }}>Timetable Generation</h2>
      <div style={formContainerStyle}>
        {/* Class Selection Form */}
        <form style={sectionStyle}>
  <h3>Select Classes</h3>

  {/* Select All Checkbox */}
  <label style={labelStyle}>
    <input
      type="checkbox"
      checked={selectedClasses.length === classOptions.length} // Check if all are selected
      onChange={() => {
        if (selectedClasses.length === classOptions.length) {
          setSelectedClasses([]); // Unselect all
        } else {
          setSelectedClasses([...classOptions]); // Select all
        }
      }}
      style={{ marginRight: "5px", fontWeight: "bold" }}
    />
    Select All
  </label>

  {/* Individual Class Checkboxes */}
  {classOptions.map((className) => (
    <label key={className} style={labelStyle}>
      <input
        type="checkbox"
        checked={selectedClasses.includes(className)}
        onChange={() => handleClassSelection(className)}
        style={{ marginRight: "5px" }}
      />
      {className}
    </label>
  ))}
</form>




        {/* Section Allocation Form */}
        <form style={sectionStyle1}>
      <h3>Selected Classes & Sections</h3>
      {selectedClasses.map((className) => (
        <div
          key={className}
          style={{
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <label style={{ textAlign: "left", flex: 1 }}>
            {className} (Teacher: {classTeachers[`${className}-A`] || "Not Assigned"})
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={sections[className] || 1}
            onChange={(e) => handleSectionChange(className, Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      ))}
      <h4>Total Rows Required: {totalRows}</h4>
    </form>
   



        {/* Schedule Settings Form */}
        <form style={sectionStyle}>
  <h3>Schedule Settings</h3>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
    <label style={{ flex: 1 }}>Start Time:</label>
    <input
      type="time"
      value={startTime || ""}
      onChange={(e) => setStartTime(e.target.value)}
      style={{ flex: 2, maxWidth:'50px' }}
    />
  </div>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
    <label style={{ flex: 1 }}>Period Duration:</label>
    <input
      type="number"
      min="10"
      max="120"
      value={periodDuration}
      onChange={(e) => setPeriodDuration(Number(e.target.value))}
      style={{ flex: 2, maxWidth: "50px" }}
    />
  </div>

 

  {/* Morning Interval Checkbox */}
  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
    <label style={{ flex: 1 }}>Morning Interval:</label>
    <input
      type="checkbox"
      checked={morningInterval}
      onChange={() => setMorningInterval(!morningInterval)}
      style={{ flex: 2 }}
    />
  </div>

  {/* Morning Interval Inputs */}
  {morningInterval && (
    <>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <label style={{ flex: 1 }}>After how many periods?</label>
        <input
          type="number"
          min="1"
          max={numberOfPeriods}
          value={morningIntervalAfter || ""}
          onChange={(e) => setMorningIntervalAfter(Number(e.target.value))}
          style={{ flex: 2, maxWidth: "50px" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <label style={{ flex: 1 }}>Morning Interval Duration (mins):</label>
        <input
          type="number"
          min="5"
          max="30"
          value={morningIntervalDuration || ""}
          onChange={(e) => setMorningIntervalDuration(Number(e.target.value))}
          style={{ flex: 2, maxWidth: "50px" }}
        />
      </div>
    </>
  )}

{/* Lunch Interval Checkbox */}
<div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
  <label style={{ flex: 1 }}>Lunch Interval:</label>
  <input
    type="checkbox"
    checked={lunchInterval}
    onChange={(e) => setLunchInterval(e.target.checked)}
    style={{ flex: 2 }}
  />
</div>

{/* Lunch Interval Inputs */}
{lunchInterval && (
  <>
    <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
      <label style={{ flex: 1 }}>After how many periods?</label>
      <input
        type="number"
        min="1"
        max={numberOfPeriods}
        value={lunchIntervalAfter || ""}
        onChange={(e) => setLunchIntervalAfter(Number(e.target.value))}
        style={{ flex: 2, maxWidth: "50px" }}
      />
    </div>

    <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
      <label style={{ flex: 1 }}>Lunch Interval Duration (mins):</label>
      <input
        type="number"
        min="5"
        max="120"
        value={lunchIntervalDuration || ""}
        onChange={(e) => setLunchIntervalDuration(Number(e.target.value))}
        style={{ flex: 2, maxWidth: "50px" }}
      />
    </div>
  </>
)}

  {/* Afternoon Interval Checkbox */}
  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
    <label style={{ flex: 1 }}>Afternoon Interval:</label>
    <input
      type="checkbox"
      checked={afternoonInterval}
      onChange={() => setAfternoonInterval(!afternoonInterval)}
      style={{ flex: 2 }}
    />
  </div>

  {/* Afternoon Interval Inputs */}
  {afternoonInterval && (
    <>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <label style={{ flex: 1 }}>After how many periods?</label>
        <input
          type="number"
          min="1"
          max={numberOfPeriods}
          value={afternoonIntervalAfter || ""}
          onChange={(e) => setAfternoonIntervalAfter(Number(e.target.value))}
          style={{ flex: 2, maxWidth: "50px" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <label style={{ flex: 1 }}>Afternoon Interval Duration (mins):</label>
        <input
          type="number"
          min="5"
          max="30"
          value={afternoonIntervalDuration || ""}
          onChange={(e) => setAfternoonIntervalDuration(Number(e.target.value))}
          style={{ flex: 2, maxWidth: "50px" }}
        />
      </div>
    </>
  )}
 <div style={{display: 'flex', flexDirection: 'row' , alignItems: "center", marginBottom: "8px" }}>
 <label style={{ alignItems:'end' }}>Total Number of Periods</label>
 <label style={{  fontSize:'10px', flex:2 }}>(includig intervals)</label>


   
    <input
      type="number"
      min="1"
      max="10"
      value={numberOfPeriods}
      onChange={(e) => setNumberOfPeriods(Number(e.target.value))}
      style={{ flex: 2, maxWidth: "50px", alignItems:'end' }}
    />
  </div>

 

</form> 
       
       <Extraactivityform setCustomActivities={setCustomActivities} />
      </div>

      {/* Submit Button */}
     <div style={{ textAlign: "center", marginTop: "20px" }}>
  <button
    onClick={handleSubmit}
    style={buttonStyle}
    onMouseOver={e => (e.target.style.backgroundColor = "rgba(10,120,100,255)")}   // hover color
    onMouseOut={e => (e.target.style.backgroundColor = "rgba(15,150,128,255)")}   // reset
  >
    Generate Timetable
  </button>
</div>

      {/* Display Timetable */}
      <div>
  {Object.keys(timetable).map((className) => (
    <div
      key={className}
      style={{
        width: "100%",
        maxWidth: "1600px",
        margin: "20px auto",
        padding: "20px",
        marginLeft: "0",
        marginRight: "0",
      }}
    >
      <h2>
  Class {className}
  <button
    onClick={() =>
      editingClasses[className]
        ? handleSaveClass(className)
        : handleEditClass(className)
    }
    style={{ marginLeft: "10px", padding: "5px 10px", cursor: "pointer" }}
  >
    {editingClasses[className] ? "Save" : "Edit"}
  </button>
  <button
    onClick={() => handleRemoveClass(className)}
    style={{ marginLeft: "10px", padding: "5px 10px", cursor: "pointer" }}
  >
    Remove
  </button>
</h2>


      {Object.keys(timetable[className]).map((section) => {
        return (
          <div key={section} style={{ marginBottom: "20px" }}>
            <h3>Section: {section}</h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "center",
                marginLeft: "0",
                marginRight: "0",
              }}
            >
<thead>
  <tr>
    <th
      style={{
        background: "#5a7488",
        color: "white",
        padding: "10px",
        border: "1px solid #ccc",
      }}
    >
      Day
    </th>
    {Object.values(timetable[className][section])[0].map((period, index) => {
      // Check if it's an interval and render accordingly
      const periodNumber = period.interval ? null : `Period ${period.period}`;
     
      return (
        <th
          key={index}
          style={{
            background: "#5a7488",
            color: "white",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          {period.interval ? period.interval : periodNumber} {/* ✅ Show correct period number */}
        </th>
      );
    })}
  </tr>
</thead>



              <tbody>
                {Object.keys(timetable[className][section]).map((day) => {
                  let periodCounter = 1; // Start period counter at 1 for each day

                  return (
                    <tr key={day}>
                      <td
                        style={{
                          background: "#5a7488",
                          color: "white",
                          fontWeight: "bold",
                          padding: "10px",
                          border: "1px solid #ccc",
                        }}
                      >
                        {day}
                      </td>
                      {timetable[className][section][day].map((period, index) => {
  const isInterval = !!period?.interval;

  // Only increment counter for actual periods (not intervals)
  const periodNumber = isInterval ? null : periodCounter++;

  return (
    <td
      key={index}
      style={{
        minWidth: "100px",
        padding: "10px",
        border: "1px solid #ccc",
        background: isInterval ? "#f0f0f0" : "white",
        fontWeight: isInterval ? "bold" : "normal",
        color: isInterval ? "#333" : "#000",
      }}
    >
      {isInterval ? (
        <span>{period.interval}</span> // Show Interval Name
      ) : period ? (
        <>
          {/* <span
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Period {periodNumber}
          </span> */}
           <span style={{ fontSize: "12px",  color: "black" , fontWeight:'bold'}}>
            {period.from_time} - {period.to_time}  {/* ✅ Added Time Here */}
          </span>
          <br />
          {editingClasses[className] ? (
  <>
    <input
      type="text"
      value={period.subject}
      onChange={(e) => {
        const newValue = e.target.value;
        setTimetable(prev => {
          const updated = { ...prev };
          updated[className][section][day][index] = {
            ...period,
            subject: newValue
          };
          return updated;
        });
      }}
      style={{ width: "80px", marginBottom: "4px" }}
    />
    <br />
    <input
      type="text"
      value={period.teacher}
      onChange={(e) => {
        const newValue = e.target.value;
        setTimetable(prev => {
          const updated = { ...prev };
          updated[className][section][day][index] = {
            ...period,
            teacher: newValue
          };
          return updated;
        });
      }}
      style={{ width: "80px" }}
    />
  </>
) : (
  <>
    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#5a7488" }}>
      {period.subject}
    </span>
    <br />
    <span style={{ fontSize: "12px", color: "#555" }}>
      {period.teacher}
    </span>
  </>
)}

          <br />
         
        </>
      ) : (
        <span>Empty</span>
      )}
    </td>
  );
})}

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  ))}
</div>





     
    </div>
    </div></div></div></>
  );
};

export default TimetableGeneration;