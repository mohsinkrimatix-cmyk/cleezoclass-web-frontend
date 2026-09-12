import { AlignJustify } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { FaUser } from "react-icons/fa";
import questionData from './Questionpaper.json'; 
import { useLocation } from 'react-router-dom';
import abcLogo from "../assets/abc school.png"; // adjust path if needed

// Desktop Constants
const STEP_WIDTH = 180;
const LINE_WIDTH = 100;

const ParentAdmissionPage = () => {
  const [parentData, setParentData] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const location = useLocation();
  const schoolCode = location.state?.schoolCode;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const storedData = localStorage.getItem("parentData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setParentData(parsedData);
      
      const classLevel = String(parsedData.lead_admission_for);
      const relevantQuestions = questionData.filter(q => String(q.class) === classLevel);
      setFilteredQuestions(relevantQuestions);
    }
  }, []);

  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState({ total: 0, correct: 0 });

  const calculateAndSubmit = async () => {
    let correctCount = 0;
    filteredQuestions.forEach(q => {
      if (userAnswers[q.id] === q.answer) correctCount++;
    });

    const totalQuestions = filteredQuestions.length;
    setScore({ total: totalQuestions, correct: correctCount });

    try {
      const response = await fetch(`https://cleezoclass.com:4000/api/leads/update-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: parentData.id,
          schoolCode: schoolCode,
          test_score: correctCount,
          total_marks: totalQuestions,
          test_status: 'Completed'
        }),
      });

      if (response.ok) {
        setTestSubmitted(true);
        const updatedData = { ...parentData, result_status: 'Completed' };
        setParentData(updatedData);
        localStorage.setItem("parentData", JSON.stringify(updatedData));
      } else {
        alert("Failed to save test results.");
      }
    } catch (error) {
      console.error("Error submitting score:", error);
    }
  };

  const handleOptionChange = (questionId, option) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const closeTest = () => {
    setIsTestOpen(false);
    setTestSubmitted(false);
    setUserAnswers({});
  };

  const getCurrentStep = () => {
    if (!parentData) return 0;
    if (parentData.enrolled) return 5; 
    if (parentData.score) return 4;
    if (parentData.counsellorDetails?.name) return 3;
    if (parentData.testDetails?.test_date) return 2;
    if (parentData.reg_no) return 1;
    return 0;
  };

  const currentStep = getCurrentStep();

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const stepCircleColors = {
    1: "#3182ce", 2: "#c05621", 3: "#ecc94b", 4: "#3182ce", 5: "#48bb78"
  };
  const inactiveLineColor = "#e2e8f0";

  if (!parentData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading profile...</h2>
      </div>
    );
  }

  // --- Sub-Components ---
  const Section = ({ title, children, variant = "default" }) => {
    return (
      <div style={variant === "lead" ? styles.sectionContainer1 : styles.sectionContainer(isMobile)}>
        <div style={styles.sectionTitle}>{title}</div>
        {children}
      </div>
    );
  };
const LeadDetails = () => {
  const [lead, setLead] = useState(null);
  const schoolCode = localStorage.getItem("schoolCode");
const regNoFromStorage = parentData?.reg_no;

  useEffect(() => {
    if (!schoolCode || !regNoFromStorage) return;

    fetch(`https://cleezoclass.com:4000/api/communication/leads?schoolCode=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        // Filter all objects with the same reg_no
        const matchingLeads = data.filter(
          (l) => String(l.reg_no).trim() === String(regNoFromStorage).trim()
        );

        if (matchingLeads.length === 0) return;

        // Merge all objects into one
        const mergedLead = matchingLeads.reduce((acc, curr) => {
          return { ...acc, ...curr };
        }, {});

        setLead(mergedLead);
      })
      .catch((err) => console.error("Fetch failed:", err));
  }, [schoolCode, regNoFromStorage]);

  if (!lead) return <div>No lead found for the given registration ID.</div>;

  return (
        <Section title="" variant="lead">

<div
  style={{
    display: "flex",           // <-- make flex container
    flexDirection: "column",   // stack items vertically
    justifyContent: "flex-start", // aligns items vertically (top)
    alignItems: "flex-start",  // aligns items horizontally (left)
    fontSize: "12px",
    lineHeight: "18px",
    padding: "15px",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#333",
    maxWidth: "400px",
  }}
>
  <h3 style={{ marginBottom: "10px", fontSize: "16px", color: "#222", fontWeight:'bold' }}>Student Details</h3>

  <div style={{ marginBottom: "4px" }}>
    <b>Full Name:</b> {lead.full_name || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Reg No:</b> {lead.reg_no || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Class:</b> {lead.lead_admission_for || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Mobile:</b> {lead.mobile_number || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Email:</b> {lead.email_id || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Student Name:</b> {lead.student_name || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Occupation:</b> {lead.occupation || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Blood Group:</b> {lead.blood_group || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>DOB:</b> {lead.dob ? new Date(lead.dob).toLocaleDateString() : "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Lead Time:</b> {lead.lead_time || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Entry Type:</b> {lead.entry_type || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Test Status:</b> {lead.test_status || "Pending"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Ticket No:</b> {lead.ticket_no || "N/A"}
  </div>
</div>
</Section>
  );
};


const EnrollmentSection1 = ({ selectedLead, setSelectedLead }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [leads, setLeads] = useState([]);

  // 🔐 LocalStorage values
  const schoolCode = localStorage.getItem("schoolCode");
const parentData = JSON.parse(localStorage.getItem("parentData") || "{}");
const regNoFromStorage = parentData?.reg_no;

  console.log("📦 localStorage schoolCode:", schoolCode);
  console.log("📦 localStorage reg_no:", regNoFromStorage);

  // 📡 Fetch leads
  useEffect(() => {
    console.log("🔁 useEffect triggered");

    if (!schoolCode) {
      console.warn("❌ schoolCode missing → API NOT CALLED");
      return;
    }

    const url = `https://cleezoclass.com:4000/api/communication/leads?schoolCode=${schoolCode}`;
    console.log("🌐 Fetching URL:", url);

    fetch(url)
      .then((res) => {
        console.log("📡 Fetch status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("✅ Raw API response:", data);
        console.log("📊 Total leads received:", data?.length);

        if (!Array.isArray(data)) {
          console.error("❌ API did NOT return an array");
          setLeads([]);
          return;
        }

        setLeads(data);
      })
      .catch((err) => {
        console.error("❌ Fetch failed:", err);
      });
  }, [schoolCode]);

  // 🔍 FILTER + DEBUG
const filteredLeads = leads.filter((lead) => {
  if (!regNoFromStorage) {
    return false;
  }

  const leadReg = String(lead.reg_no).trim();
  const storedReg = String(regNoFromStorage).trim();

  return leadReg === storedReg;
});


  // 🧩 Group channels
  const groupedLeads = Object.values(
    filteredLeads.reduce((acc, lead) => {
      if (!acc[lead.id]) {
        acc[lead.id] = {
          ...lead,
          channels: lead.channel ? [lead.channel] : [],
        };
      } else if (
        lead.channel &&
        !acc[lead.id].channels.includes(lead.channel)
      ) {
        acc[lead.id].channels.push(lead.channel);
      }
      return acc;
    }, {})
  );


  return (
    <Section title="" variant="lead">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: "bold" }}>
          Timeline
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ fontSize: "11px" }}
        />
      </div>

      {/* Empty State */}
      {groupedLeads.length === 0 && (
        <div
          style={{
            fontSize: "12px",
            color: "#999",
            textAlign: "center",
            padding: "10px",
          }}
        >
          ❌ No leads found for this Registration Number
        </div>
      )}

      {/* Timeline */}
      {groupedLeads.map((lead, index) => {
        const formattedDate = new Date(lead.date)
          .toISOString()
          .split("T")[0];

        const hasChannels =
          lead.channels && lead.channels.length > 0;

        const statusLabel = hasChannels
          ? "REGISTERED"
          : "CANCELLED";

        const statusColor = hasChannels
          ? "#007bff"
          : "#dc3545";
const StepRow = ({ title, active, isLast, children }) => (
  <div style={{ display: "flex", alignItems: "flex-start" }}>
    {/* Icon + Line */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginRight: "10px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: `3px solid ${active ? "#007bff" : "#ccc"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        <FaUser size={14} color={active ? "#007bff" : "#999"} />
      </div>

      {!isLast && (
        <div
          style={{
            width: "2px",
            height: "18px",
            backgroundColor: active ? "#007bff" : "#ccc",
          }}
        />
      )}
    </div>

    {/* Step Content */}
    <div style={{ fontSize: "10px", paddingBottom: "8px" }}>
      <div
        style={{
          fontWeight: "bold",
          color: active ? "#007bff" : "#999",
          fontSize: "10px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  </div>
);

        return (
        <div style={{justifyContent:'flex-start', textAlign:'left'}}>
  <StepRow title="Registration" active={true}>
    Reg No: <b>{lead.reg_no}</b>
    <br />
    Student: {lead.full_name}{',  '}
    Class: {lead.lead_admission_for}
  </StepRow>

  <StepRow
    title="Test & Counselling"
    active={
      lead?.test_status ||
      lead?.counselling_required === "Yes"
    }
  >
    Test Status: {lead?.test_status || "Not Scheduled"}
    <br />
    Counselling:{" "}
    {lead?.counselling_required === "Yes"
      ? "Required"
      : "Not Required"}
  </StepRow>

  <StepRow
    title="Communication"
    active={lead?.sent === 1 || lead?.channel}
    isLast
  >
    Channel: {lead?.channel || "Not Sent"}
    <br />
    Message: {lead?.message || "No message"}
  </StepRow>
</div>

        );
      })}
    </Section>
  );
};
const StepItem = ({ step, label, details, isLast }) => {
    const color = currentStep >= step ? stepCircleColors[step] : "#cbd5e0";
    const nextStepColor = currentStep > step ? stepCircleColors[step + 1] : inactiveLineColor;
    
    if (isMobile) {
      return (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', position: 'relative', alignItems:'center' }}>
          {/* Left Column: Circle and Vertical Line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px', flex:1 }}>
            <div style={styles.circle(color, true)}>{step}</div>
            {!isLast && (
              <div style={{ 
                width: '3px', 
                height: '60px', // Adjust height to control spacing
                background: nextStepColor, 
                position: 'relative',
                margin: '5px 0' 
              }}>
                {/* Vertical Arrowhead pointing down */}
                <div style={{
                  width: 0, height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: `8px solid ${nextStepColor}`,
                  position: "absolute", 
                  bottom: -5, 
                  left: -4.5 
                }} />
              </div>
            )}
          </div>

          {/* Right Column: Text Details */}
          <div style={{ paddingTop: '10px', flex: 1 , marginTop:'100px'}}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2d3748', marginBottom: '4px' }}>{label}</div>
            <div style={styles.stepDetails}>{details}</div>
          </div>
        </div>
      );
    }

    // Desktop View (Horizontal)
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: STEP_WIDTH }}>
          <div style={styles.stepLabel}>{label}</div>
          <div style={styles.circle(color, false)}>{step}</div>
          <div style={styles.stepDetails}>{details}</div>
        </div>
        {!isLast && (
          <div style={{ width: LINE_WIDTH }}>
            <div style={styles.line(nextStepColor)}>
              <div style={styles.arrowhead(nextStepColor)} />
            </div>
          </div>
        )}
      </div>
    );
  };
    const header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "16px 16px 0 0",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
    padding: isMobile ? "15px" : "25px",
    marginBottom: isMobile ? "15px" : "25px",
    flexWrap: isMobile ? "wrap" : "nowrap",
    gap: isMobile ? "10px" : "0",

    /* IMPORTANT FOR STICKY HEADER */
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };
 const logoBox = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    order: isMobile ? 1 : 0,
  };const logo = {
    width: "60px",
    height: "60px",
    backgroundImage: `url(${abcLogo})`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    borderRadius: "8px",
  };
    const schoolTitle = {
    fontSize: isMobile ? "16px" : "20px",
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    flex: isMobile ? "1 1 100%" : 1,
    order: isMobile ? 3 : 0,
    marginTop: isMobile ? "10px" : "0",
  };
  
const isTestWindowActive = () => {
  const testDate = parentData?.testDetails?.test_date; // YYYY-MM-DD
  const testTime = parentData?.testDetails?.test_time; // HH:mm

  if (!testDate || !testTime) return false;

  const now = new Date();

  // 1️⃣ STRICT DATE CHECK (must be same date)
  const today = now.toISOString().split("T")[0];
  if (today !== testDate) return false;

  // 2️⃣ START TIME (date + time)
  const startTime = new Date(`${testDate}T${testTime}:00`);

  // 3️⃣ END TIME (+45 mins)
  const endTime = new Date(startTime.getTime() + 45 * 60 * 1000);

  // 4️⃣ FINAL WINDOW CHECK
  return now >= startTime && now <= endTime;
};


  return (
    <div style={styles.wrapper}>
      <div style={styles.container(isMobile)}>
   <div style={header}>
          <div style={logoBox}>
            <div style={logo}></div>
            
          </div>
          <div style={schoolTitle}>ABC School, Miyapur, Hyderabad</div>
       
        </div>        
        <div style={styles.mainGrid(isMobile)}>
          <div style={styles.leftCol(isMobile)}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: isMobile ? '18px' : '22px' }}>
              Welcome {parentData.full_name.split(' ')[0]}!
            </h1>
       <div style={styles.profileBox(isMobile)}>

  {/* LEFT: PHOTO + DATE */}
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px' }}>
    <div style={styles.photoCircle}>
      {parentData.student_photo ? (
        <img
          src={parentData.student_photo}
          alt="Student"
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{ color: '#888' }}>No Photo</span>
      )}
    </div>

    <p style={{
      fontSize: '8px',
      color: '#999',
      marginTop: '8px',
      textAlign: 'center',
      lineHeight: '1.4'
    }}>
      <span>Assigned: {new Date(parentData.date).toLocaleDateString('en-GB')}</span>
      <br />
      <span>Shortlist: 28/11/25</span>
    </p>
  </div>

  {/* RIGHT: DETAILS */}
  <div style={{ flex: 1 }}>
 
<div
  style={{
    display: "flex",           // <-- make flex container
    flexDirection: "column",   // stack items vertically
    justifyContent: "flex-start", // aligns items vertically (top)
    alignItems: "flex-start",  // aligns items horizontally (left)
    fontSize: "12px",
    lineHeight: "18px",
    padding: "15px",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#333",
    maxWidth: "400px",
  }}
>


  <div style={{ marginBottom: "4px" }}>
    <b>Reg No:</b> {parentData.reg_no || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Class:</b> {parentData.lead_admission_for || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Mobile:</b> {parentData.mobile_number || "N/A"}
  </div>
  <div style={{ marginBottom: "4px" }}>
    <b>Email:</b> {parentData.email || "N/A"}
  </div>



  <div style={{ marginBottom: "4px" }}>
    <b>Ticket No:</b> {parentData.ticket_no || "N/A"}
  </div>
</div>

  </div>

</div>

          </div>
          <div style={styles.rightCol1(isMobile)}>
          <LeadDetails lead={parentData} />
          </div>
          <div style={styles.rightCol(isMobile)}>
            <EnrollmentSection1 selectedLead={selectedLead} setSelectedLead={setSelectedLead} />
          </div>
        </div>

        <div style={styles.progressWrapper(isMobile)}>
          <div style={isMobile ? { display: 'flex', flexDirection: 'column' } : { display: 'flex' }}>
            <StepItem 
              step={1} 
              label="Registration" 
              details={<div>Date: {formatDate(parentData.date)}<br/>Reg: {parentData.reg_no}</div>} 
            />
            <StepItem 
              step={2} 
              label="Test" 
              details={
                 <div style={styles.stepCol}>
      <div style={styles.stepDetails}>
  <div>
    Invigilator: {parentData?.counsellorDetails?.name || "—"}
  </div>

  <div>
    Mode: {parentData?.testDetails?.test_mode || "—"}
  </div>

  <div>
    {formatDate(parentData?.testDetails?.test_date)} |{" "}
    {parentData?.testDetails?.test_time}
  </div>

  {/* START TEST BUTTON */}
  {currentStep >= 2 ? (
    isTestWindowActive() ? (
      <button
        onClick={() => setIsTestOpen(true)}
        style={styles.meetButton}
      >
        START ONLINE TEST
      </button>
    ) : (
      <span style={{ color: "#999", fontSize: "10px" }}>
        Available from {parentData?.testDetails?.test_time} for 45 mins
      </span>
    )
  ) : (
    <span style={{ color: "#aaa", fontSize: "10px", fontStyle: "italic" }}>
      Test not yet unlocked
    </span>
  )}

  {/* GOOGLE MEET LINK */}
  <div style={{ marginTop: "5px" }}>
    Gmeet Link:{" "}
    {currentStep >= 2 && isTestWindowActive() ? (
      <a
        href="https://meet.google.com/zbt-baav-nfe"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#3182ce",
          textDecoration: "underline",
          fontSize: "10px",
          fontWeight: "500",
        }}
      >
        Click here to join Google Meet
      </a>
    ) : (
      <span
        style={{
          fontSize: "10px",
          color: "#aaa",
          fontStyle: "italic",
        }}
      >
        Not available
      </span>
    )}
  </div>
</div>

        </div>
              } 
            />
            <StepItem 
              step={3} 
              label="Counselling" 
              details={<div style={styles.stepCol}>
  <div style={styles.stepDetails}>
    <div>Counsellor: {parentData?.counsellorDetails?.name || "—"}</div>
    <div>Scheduled on: {formatDate(parentData?.counsellingDetails?.counselling_date)}</div>
    
    {/* NEW GOOGLE MEET LINK */}
<div style={{ marginTop: "5px" }}>
  Gmeet Link:{" "}
  {currentStep >= 3 ? (
    <a
        href="https://meet.google.com/zbt-baav-nfe" 
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#3182ce",
        textDecoration: "underline",
        fontSize: "10px",
        fontWeight: "500",
      }}
    >
      Click here to join Google Meet
    </a>
  ) : (
    <span style={{ fontSize: "10px", color: "#aaa", fontStyle: "italic" }}>
      Not available
    </span>
  )}
</div>
  </div>
</div>} 
            />
            <StepItem 
              step={4} 
              label="Result" 
              details={<div style={{ ...styles.stepCol }}>
  <div style={styles.stepDetails}>
    <div>
      Test Result:{" "}
      {parentData?.score != null && parentData?.marks
        ? `${Math.round((parentData.score / parentData.marks) * 100)}%`
        : "—"}
    </div>
    <div>Counselling Result:: {parentData.message|| "—"}</div>

    <div>
      Issued on:{" "}
      {formatDate(parentData?.counsellingDetails?.counselling_date)}
    </div>
  </div>
</div>} 
            />
            <StepItem 
              step={5} 
              label="Fees" 
              isLast={true}
              details={<div>Status: {parentData.enrolled ? 'Paid' : 'Pending'}</div>} 
            />
          </div>
        </div>

        {/* Modal for Online Test */}
        {isTestOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent(isMobile)}>
              {!testSubmitted ? (
                <>
                  <div style={styles.modalHeader}>
                    <h3>Entrance Test</h3>
                    <button onClick={closeTest} style={styles.closeBtn}>×</button>
                  </div>
                  <div style={styles.questionList}>
                    {filteredQuestions.map((q, idx) => (
                      <div key={q.id} style={styles.qBox}>
                        <p><strong>Q{idx + 1}. {q.question}</strong></p>
                        <div style={styles.optionsGrid}>
                          {q.options.map(opt => (
                            <label key={opt} style={styles.optLabel}>
                              <input type="radio" name={`q-${q.id}`} onChange={() => handleOptionChange(q.id, opt)} /> {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={calculateAndSubmit} style={styles.submitBtn}>SUBMIT TEST</button>
                </>
              ) : (
                <div style={styles.resultContainer}>
                  <h2>Test Completed!</h2>
                  <div style={styles.scoreValue}>{score.correct} / {score.total}</div>
                  <button onClick={closeTest} style={styles.closeBtnLarge}>Back to Dashboard</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
wrapper: {
  backgroundColor: 'rgb(107, 121, 131)', // sets a grayish background
  minHeight: '100vh',                    // ensures wrapper takes full viewport height
  padding: '10px'                        // adds 10px spacing inside all edges
}
,  container: (isMobile) => ({
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: '1800px',
    margin: '0 auto',
    borderRadius: '8px',
    padding: isMobile ? '15px' : '40px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    minHeight: '90vh'
  }),
  header: { padding: "10px", fontSize: "20px", fontWeight: "700", textAlign: "center", borderBottom: "1px solid #eee" },
  mainGrid: (isMobile) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '20px' : '40px',
    marginTop: '20px'
  }),
  leftCol: (isMobile) => ({ flex: 1 ,borderRight: isMobile ?'none': "4px solid #979595ff"}),
  rightCol: (isMobile) => ({ width: isMobile ? '100%' : '350px', flex:1,  }),
    rightCol1: (isMobile) => ({ width: isMobile ? '100%' : '350px', flex:1 ,borderRight: isMobile ?'none': "4px solid #979595ff"}),

  profileBox: (isMobile) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '15px',
    background: '#fff',
    padding: '15px',
    borderRadius: '10px'
  }),
  photoCircle: { width: '100px', height: '100px', borderRadius: '50%', border: '2px solid #3182ce', overflow: 'hidden', flexShrink: 0 },
  infoTable: { fontSize: '9px', width: '100%' },
  sectionContainer: (isMobile) => ({
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #eee',
    height: isMobile ? 'auto' : '42vh',
    overflowY: 'auto',
        scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox

  }),
  sectionContainer1: {
    padding: '12px', // Reduced padding
    borderRadius: '6px', // Reduced radius
    marginBottom: '15px', // Reduced margin
      overflowY: 'auto',       // enable vertical scroll
  height: '24vh',          // fixed height
    scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
  }, 
  
  labelCell: {
  fontWeight: 'bold',
  padding: '4px 6px 4px 0',
  whiteSpace: 'nowrap',
},

valueCell: {
  padding: '4px 0',
},
progressWrapper: (isMobile) => ({
    marginTop: '40px',
    padding: '10px',
    overflowX: isMobile ? 'hidden' : 'auto',
        scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
  }),
circle: (color, isMobile) => ({
    width: isMobile ? '60px' : '80px', // Reduced mobile size from 100px to 60px for better fit
    height: isMobile ? '60px' : '80px',
    borderRadius: '50%',
    border: `3px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: isMobile ? '18px' : '24px',
    color: color,
    background: '#fff',
    zIndex: 2,
    transition: 'all 0.3s ease'
  }),

  progressWrapper: (isMobile) => ({
    marginTop: '40px',
    padding: isMobile ? '20px 10px' : '10px',
    overflowX: isMobile ? 'hidden' : 'auto',
    backgroundColor: isMobile ? '#fff' : 'transparent',
    borderRadius: '12px',
        scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
  }),

  stepDetails: { 
    fontSize: '13px', 
    marginTop: '5px', 
    color: '#4a5568',
    lineHeight: '1.4' 
  },
  line: (color) => ({
    height: '2px',
    width: '100%',
    background: color,
    position: 'relative'
  }),
  arrowhead: (color) => ({
    width: 0, height: 0,
    borderTop: "4px solid transparent",
    borderBottom: "4px solid transparent",
    borderLeft: `6px solid ${color}`,
    position: "absolute", right: -2, top: -3
  }),
  stepLabel: { fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' },
  stepDetails: { fontSize: '12px', marginTop: '5px', color: '#666' },
  meetButton: { background: '#3182ce', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: (isMobile) => ({
    backgroundColor: '#fff',
    width: isMobile ? '95%' : '600px',
    padding: '20px',
    borderRadius: '12px',
    maxHeight: '90vh',
    overflowY: 'auto',
        scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
  }),
   infoContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '400px', // adjust as needed
    margin: '0 auto',
    fontSize:'10px'
  },

  infoRow: {
    display: "flex",           // <-- make flex container
    flexDirection: "row",   // stack items vertically
    justifyContent: "flex-start", // aligns items vertically (top)
    alignItems: "flex-start",  // aligns items horizontally (left)
    fontSize: "12px",
    lineHeight: "18px",
    padding: "15px",
    borderRadius: "6px",
    backgroundColor: "red",
    color: "#333",
    maxWidth: "400px",


  },
  label: {
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontWeight: '400',
    color: '#000',
  },
  qBox: { padding: '15px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '10px' },
  optLabel: { display: 'block', padding: '8px', margin: '5px 0', background: '#f8f9fa', borderRadius: '4px', cursor: 'pointer' },
  submitBtn: { width: '100%', padding: '12px', background: '#48bb78', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', marginTop: '10px' }
};

export default ParentAdmissionPage;