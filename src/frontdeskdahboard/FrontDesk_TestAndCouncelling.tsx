import React, { useState, useEffect, useRef, ChangeEvent, MouseEvent } from "react";
import '../STYLES/solidbutton.css';
import './FrontDesk_TestAndCouncelling.css'
import axios from "axios";
import { FaUser } from "react-icons/fa";
import ErrorPopup from "../shared/ErrorPopup";

// --- Interfaces ---

interface Teacher {
  teacher_id: string | number;
  teacher_name: string;
  phone_no: string;
  subject?: string;
  designation?: string
}

interface Lead {
  id: string | number;
  full_name: string;
  student_name?: string; // used in WhatsApp helper
  date: string;
  lead_time: string;
  mobile_number: string;
  lead_admission_for: string;
  email_id?: string;
  entry_type: string;
  teacher_decision?: string;
  assigned_teacher_name?: string;
}

// --- Utility Styles ---
const styles: Record<string, React.CSSProperties | any> = {
  scaleFactor: 0.85,
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '15px',
    backgroundColor: '#f5f5f5',
  },
  processHeading: {
    textAlign: 'left',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#444',
    letterSpacing: '1px',
  },
  mainGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  rightColumn: {
    display: 'grid',
    height: '100%',
  },
  equalBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '15px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '1px solid #ccc',
    paddingBottom: '8px',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    padding: '12px',
    borderRadius: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    marginBottom: '15px',
    border: '4px solid #ddd',
    height: '30vh',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sectionContainer1: {
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '15px',
    overflowY: 'auto',
    height: '28vh',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#404040',
    paddingBottom: '4px',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '8px',
  },
  label: {
    fontSize: '10px',
    color: '#555',
    marginBottom: '1px',
    textAlign: 'left'
  },
  input: {
    padding: '6px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    fontSize: '12px',
    width: '150px',
    height: '25px'
  },
};

// --- Sub-Components ---

interface SectionProps {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "lead" | "marketing";
  style?: React.CSSProperties;
  className?: string; // ✅ ADD THIS
}


const Section: React.FC<SectionProps> = ({ title, children, variant = "default", style = {} }) => {
  const compactVariants = ["lead", "marketing"];
  const containerStyle = compactVariants.includes(variant)
    ? styles.sectionContainer1
    : styles.sectionContainer;

  return (
    <div className={compactVariants.includes(variant) ? "tc-sectionContainer1" : "tc-sectionContainer"}>
  <div className="tc-sectionTitle">{title}</div>
  {children}
</div>

  );
};

interface EnrollmentSectionProps {
  onSelectTeacher: (teacher: Teacher) => void;
  selectedTeacher: Teacher | null;
  selectedLead: Lead | null;
}

export const EnrollmentSection: React.FC<EnrollmentSectionProps> = ({ onSelectTeacher, selectedTeacher, selectedLead }) => {
  const schoolCode = localStorage.getItem("schoolCode");
  const [counsellingRequired, setCounsellingRequired] = useState<boolean>(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<string>("Offline");
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"Test" | "Counselling">("Test");
  const popupRef = useRef<HTMLDivElement>(null);

  const [counsellingDate, setCounsellingDate] = useState<string>("");
  const [counsellingTime, setCounsellingTime] = useState<string>("");
  const [testDate, setTestDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [testTime, setTestTime] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | any) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupVisible(false);
      }
    };
    if (popupVisible) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popupVisible]);
  const [errorMsg, setErrorMsg] = useState("");

 const handleAssign = async () => {
  try {
    if (!selectedTeacher || !selectedLead) {
      setErrorMsg("Kindly select both the lead and the teacher.");
      return;
    }

    if (counsellingRequired && (!counsellingDate || !counsellingTime)) {
      setErrorMsg("Kindly select the counselling date and time.");
      return;
    }

    const response = await fetch(
      "https://cleezoclass.com:4000/api/api/add-lead",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateType: "ASSIGN_TEACHER",
          lead_id: selectedLead.id,
          schoolCode,
          assigned_teacher_id: selectedTeacher.teacher_id,
          assigned_teacher_name: selectedTeacher.teacher_name,
          test_date: testDate,
          test_time: testTime,
          test_mode: testMode,
          counselling_required: counsellingRequired ? "Yes" : "No",
          counselling_date: counsellingRequired ? counsellingDate : null,
          counselling_time: counsellingRequired ? counsellingTime : null,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Show success message first
      setErrorMsg("Teacher has been successfully assigned.");

      // Wait a bit before sending WhatsApp
      setTimeout(() => {
        sendTeacherWhatsapp(); // trigger WhatsApp after message shows
      }, 1000); // 1 second delay (adjust if needed)
    } else {
      setErrorMsg(
        data.message || "Unable to assign the teacher. Kindly try again."
      );
    }
  } catch (err) {
    console.error(err);
    setErrorMsg(
      "An unexpected error occurred while assigning the teacher. Please try again."
    );
  }
};


  const formatMobileNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 10) return "91" + cleaned;
    if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
    return null;
  };

  const sendTeacherWhatsapp = () => {
    if (!selectedTeacher || !selectedLead) return;
    const mobile = formatMobileNumber(selectedTeacher.phone_no);
    const questionPaperUrl = `https://cleezoclass.com/CRM/QuestionPaperGenerator?studentName=${encodeURIComponent(selectedLead.student_name || selectedLead.full_name)}&studentClass=${encodeURIComponent(selectedLead.lead_admission_for)}&schoolCode=${encodeURIComponent(schoolCode || "")}`;

    const message = `Hi ${selectedTeacher.teacher_name},
You have been assigned a new lead.
👤 Student: ${selectedLead.full_name}
📞 Mobile: ${selectedLead.mobile_number}
🎓 Class: ${selectedLead.lead_admission_for}
📝 Test: ${testDate} at ${testTime} (${testMode})
📄 Question Paper: ${questionPaperUrl}
📅 Counselling: ${counsellingRequired ? `${counsellingDate} at ${counsellingTime}` : "Not Required"}
Regards, Cleezoclass CRM`;

    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const fetchAvailableTeachers = async (date: string, time: string) => {
    if (!schoolCode || !date || !time) return;
    setLoading(true);
    try {
      const res = await axios.get("https://cleezoclass.com:4000/api/chief/available-teachers-marketing", {
        params: { schoolCode, date, time },
      });
      const payload = res.data;
      const data = Array.isArray(payload?.available_teachers)
        ? payload.available_teachers
        : Array.isArray(payload)
          ? payload
          : [];
      setTeachers(data);
      if (data.length > 0 && !selectedTeacher) onSelectTeacher(data[0]);
    } catch (err) {
      console.error("❌ Error loading teachers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testDate && testTime) fetchAvailableTeachers(testDate, testTime);
  }, [testDate, testTime, schoolCode]);

  const rows: Teacher[][] = [];
  for (let i = 0; i < teachers.length; i += 4) {
    rows.push(teachers.slice(i, i + 4));
  }

 return (
  <Section title="" variant="lead" >
    {/* HEADER */}
    <div className="tc-staffAssignSection">
    <div className="tc-staffHeader">
      <div className="tc-staffTitle">Staff-Assign</div>

      <div className="tc-staffDateTime">
        <input
          type="date"
          value={testDate}
          onChange={(e) => setTestDate(e.target.value)}
          className="tc-staffInput"
        />
        <input
          type="time"
          value={testTime}
          onChange={(e) => setTestTime(e.target.value)}
          className="tc-staffInput"
        />
      </div>
    </div>

    {loading && <p>Loading teachers...</p>}

    {!loading && (
      <div className="tc-teacherGrid">
        {rows.map((row, idx) => (
          <div key={idx} className="tc-teacherRow">
            {row.map((teacher) => {
              const isSelected =
                selectedTeacher?.teacher_id === teacher.teacher_id;

              return (
                <div
                  key={teacher.teacher_id}
                  className="tc-teacherCard"
                  onClick={() => {
                    onSelectTeacher(teacher);
                    setPopupVisible(true);
                  }}
                >
                  <div className="tc-teacherAvatar">
                    <FaUser
                      size={28}
                      color={isSelected ? "#e59143ff" : "#404040"}
                    />
                  </div>

                  <div className="tc-teacherName">
                    {teacher.teacher_name}
                  </div>
                  <div className="tc-teacherPhone">
                    {teacher.phone_no}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    )}

    {/* POPUP */}

    </div>
                <ErrorPopup message={errorMsg} onClose={() => setErrorMsg("")} />
    {popupVisible && (
      <div ref={popupRef} >
        <div className="co-popup">
          {/* TABS */}
          <div className="tc-popupTabs">
            <button
              onClick={() => setActiveTab("Test")}
              className={`tc-popupTab ${
                activeTab === "Test" ? "active" : ""
              }`}
            >
              Test
            </button>

            <button
              onClick={() => setActiveTab("Counselling")}
              className={`tc-popupTab ${
                activeTab === "Counselling" ? "active" : ""
              }`}
            >
              Counselling
            </button>
          </div>

          {activeTab === "Test" && (
            <div className="tc-popupContent">
              <div className="tc-popupRow">
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="tc-popupInput"
                />
                <input
                  type="time"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  className="tc-popupInput"
                />
              </div>

              <div className="tc-popupRow">
                <select
                  value={testMode}
                  onChange={(e) => setTestMode(e.target.value)}
                  className="tc-popupInput"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>

                <button
                  onClick={handleAssign}
                  disabled={!selectedLead || !selectedTeacher}
                  className="co-popup-btn"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {activeTab === "Counselling" && (
            <div className="tc-popupContent">
              <label className="tc-checkboxLabel">
                <input
                  type="checkbox"
                  checked={counsellingRequired}
                  onChange={(e) =>
                    setCounsellingRequired(e.target.checked)
                  }
                />
                Counselling Required
              </label>

              {counsellingRequired && (
                <div className="tc-popupRow">
                  <input
                    type="date"
                    value={counsellingDate}
                    onChange={(e) => setCounsellingDate(e.target.value)}
                    className="tc-popupInput"
                  />
                  <input
                    type="time"
                    value={counsellingTime}
                    onChange={(e) =>
                      setCounsellingTime(e.target.value)
                    }
                    className="tc-popupInput"
                  />
                </div>
              )}

              <button
                onClick={handleAssign}
                disabled={!selectedLead || !selectedTeacher}
                className="co-popup-btn"
              >
                Assign
              </button>
            </div>
          )}
        </div>
      </div>
    )}
  </Section>
);

};

interface EnrollmentSection1Props {
  selectedTeacher: Teacher | null;
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead) => void;
}

const EnrollmentSection1: React.FC<EnrollmentSection1Props> = ({ selectedTeacher, selectedLead, setSelectedLead }) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const schoolCode = localStorage.getItem("schoolCode");

  useEffect(() => {
    if (!schoolCode) return;
    fetch(`https://cleezoclass.com:4000/api/api/leads?schoolCode=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => setLeads(data));
  }, [schoolCode]);

  const filteredLeads = leads.filter((lead) => {
    if (!selectedTeacher) return false;
    const leadDate = new Date(lead.date).toISOString().split("T")[0];
    const teacherMatch = lead.assigned_teacher_name === selectedTeacher.teacher_name;
    const dateMatch = !selectedDate || leadDate === selectedDate;
    const decision = lead.teacher_decision?.toLowerCase();
    let statusMatch = true;
    if (statusFilter === "approved") statusMatch = decision === "approved" || decision === "accepted";
    else if (statusFilter === "rejected") statusMatch = decision === "rejected";
    else if (statusFilter === "pending") statusMatch = !lead.teacher_decision;

    return teacherMatch && dateMatch && statusMatch;
  });
const getLeadHeading = (decision?: string) => {
  if (!decision) return "Requested";

  switch (decision.toLowerCase()) {
    case "approved":
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return decision;
  }
};

  useEffect(() => {
    if (!selectedLead && filteredLeads.length > 0) setSelectedLead(filteredLeads[0]);
  }, [filteredLeads, selectedLead, setSelectedLead]);

  return (
  <Section title="" variant="lead">
    {/* HEADER ROW */}
    <div className="tc-timelineHeader">
      <div className="tc-timelineTitle">
        Timeline – All Leads
      </div>

      <div className="tc-statusFilterWrapper">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="tc-statusFilterSelect"
        >
          <option value="all">All Leads</option>
          <option value="approved">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="tc-dateFilterInput"
      />
    </div>

    {filteredLeads.length === 0 && (
      <p className="tc-noLeadsText">
        No leads assigned to this teacher.
      </p>
    )}

    {filteredLeads.map((lead, index) => {
      const formattedDate = new Date(lead.date).toISOString().split("T")[0];

      return (
        <div
          key={lead.id}
          className={`tc-leadItem ${selectedLead?.id === lead.id ? "selected" : ""}`}
          onClick={() => setSelectedLead(lead)}
        >
          {index !== filteredLeads.length - 1 && (
            <div className="tc-leadConnectorLine" />
          )}

          <div className="tc-leadItemContent">
            <div className="tc-leadDate">
              <div className="tc-leadDateValue">{formattedDate}</div>
              <div className="tc-leadTime">{lead.lead_time}</div>
            </div>

            <div className="tc-leadAvatar">
              <FaUser size={18} color="#404040" />
            </div>

            <div className="tc-leadDetails">
              <div
                className={`tc-leadHeading ${
                  lead.teacher_decision ? "approved" : "pending"
                }`}
              >
                {getLeadHeading(lead.teacher_decision)}
              </div>

              <span className="tc-leadName">{lead.full_name}</span>{" "}
              class: {lead?.lead_admission_for || "N/A"},{" "}
              Contact <b>{lead.mobile_number}</b>
              <br />
              <a
                href={`mailto:${lead?.email_id || "xxxx@gmail.com"}`}
                className="tc-leadEmail"
              >
                {lead?.email_id || "xxxx@gmail.com"}
              </a>{" "}
              / Lead Source <b>{lead.entry_type?.toUpperCase()}</b>
            </div>
          </div>
        </div>
      );
    })}
  </Section>
);

};

const LeadProgressSection: React.FC<{ lead: Lead | null; selectedTeacher: Teacher | null }> = ({ lead, selectedTeacher }) => {
  if (!lead) return null;
  return (
  <Section title="" variant="lead">
    <div className="tc-leadDetailsCard">
      {/* Top Row: Lead Information + Shortlisted */}
      <div className="tc-leadDetailsTopRow">
        <div className="tc-leadDetailsTitle">Lead Information</div>
        <div className="tc-leadShortlisted">
          <div className="tc-shortlistedTitle">Shortlisted</div>
          <div className="tc-shortlistedDate">
            {new Date(lead.date).toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="tc-leadNameRow">
        <b>Name:</b> <span className="tc-leadNameValue">{lead.full_name}</span>
      </div>

      {/* Class, Contact, Email */}
      <div className="tc-leadContactRow">
        <b>Class:</b> {lead.lead_admission_for} | <b>Contact:</b> {lead.mobile_number} | <b>Email:</b> {lead.email_id}
      </div>

      {/* Row 1: Assigned Counselor + Communication Status */}
      <div className="tc-leadRow">
        <div className="tc-leadCol">
          <div className="tc-leadColTitle">Assigned Counselor</div>
          <div className="tc-leadColContent">
            <div>Name: {lead.assigned_teacher_name}</div>
            <div>Subject: {selectedTeacher?.designation || "N/A"}</div>
          </div>
        </div>

        <div className="tc-leadCol">
          <div className="tc-leadColTitle">Communication Status</div>
          <div className="tc-leadColContent">
            <div>Email Sent: 10</div>
            <div>WhatsApp Sent: 20</div>
          </div>
        </div>

        <div className="tc-leadColFull">
          <div className="tc-leadColTitle">Details</div>
          <div className="tc-leadColContent">
            <div>Class To: 9</div>
            <div>School: TSMS</div>
          </div>
        </div>
      </div>

      {/* Row 2: Lead Source + Telephonic */}
      <div className="tc-leadRow">
        <div className="tc-leadCol">
          <div className="tc-leadColTitle">Lead Source</div>
          <div className="tc-leadColContent">
            <div>
              Adds: {["manual", "automatic"].includes(lead.entry_type?.toLowerCase()) 
                ? "Walk-in" 
                : lead.entry_type}
            </div>
          </div>
        </div>

        <div className="tc-leadCol">
          <div className="tc-leadColTitle">Telephonic</div>
          <div className="tc-leadColContent">
            <div>Incoming: 10</div>
            <div>Outgoing: 20</div>
          </div>
        </div>

        <div className="tc-leadCol">
          <div className="tc-leadColContent"></div>
        </div>
      </div>
    </div>
  </Section>
);

};

const MarketingStatus: React.FC<{ onSelectLead: (lead: Lead) => void; selectedLead: Lead | null }> = ({ onSelectLead, selectedLead }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    fetch(`https://cleezoclass.com:4000/api/api/leads?schoolCode=${schoolCode}`)
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        if (data.length > 0 && !selectedLead) onSelectLead(data[0]);
      });
  }, [onSelectLead, selectedLead]);

  const filteredLeads = leads.filter((lead) => !selectedDate || new Date(lead.date).toISOString().split("T")[0] === selectedDate);

  return (
  <Section title="" variant="lead" >
    <div >
    {/* HEADER WITH DATE FILTER */}

    <div className="tc-leadsHeader">
      {/* TITLE */}
      <div className="tc-leadsTitle">Registered Leads</div>

      {/* DATE FILTER */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="tc-dateFilterInput"
      />
    </div>

    {filteredLeads.length === 0 && (
      <p className="tc-noLeadsMessage">No leads found for selected date.</p>
    )}

    {filteredLeads.map((lead, index) => {
      const formattedDate = new Date(lead.date).toISOString().split("T")[0];

      return (
        <div
          key={lead.id}
          onClick={() => onSelectLead(lead)}
          className={`tc-leadItem ${selectedLead?.id === lead.id ? "tc-selected" : ""}`}
        >
          {index !== filteredLeads.length - 1 && <div className="tc-leadConnectorLine" />}

          <div className="tc-leadItemContent">
            {/* DATE */}
            <div className="tc-leadDate">
              <div className="tc-leadDateValue">{formattedDate}</div>
              <div className="tc-leadTime">{lead.lead_time}</div>
            </div>

            {/* USER ICON */}
            <div className="tc-leadAvatar">
              <FaUser size={18} color="#404040" />
            </div>

            {/* DETAILS */}
            <div className="tc-leadDetails">
              <span className="tc-leadName">{lead.full_name}</span> class: {lead?.lead_admission_for || "N/A"},{" "}
              Contact <b>{lead.mobile_number}</b>
              <br />
              <a
                href={`mailto:${lead?.email_id || "xxxx@gmail.com"}`}
                className="tc-leadEmail"
              >
                {lead?.email_id || "xxxx@gmail.com"}
              </a>{" "}
              / Lead Source <b>{lead.entry_type?.toUpperCase()}</b>
            </div>
          </div>
        </div>
      );
    })}
    </div>
  </Section>
);

};

const FrontDesk_TestAndCouncelling: React.FC = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
<div className="tc-container">
  <div className="tc-mainGrid">
    <div className="tc-processHeading">Test & Counselling</div>
    <div className="tc-row">
      <div className="tc-rightColumn">
            <MarketingStatus onSelectLead={setSelectedLead} selectedLead={selectedLead} />
          </div>
          <div>
            <LeadProgressSection lead={selectedLead} selectedTeacher={selectedTeacher} />
          </div>
        </div>
    <div className="tc-row">
          <div>
            <EnrollmentSection selectedTeacher={selectedTeacher} selectedLead={selectedLead} onSelectTeacher={setSelectedTeacher} />
          </div>
          <div>
            {selectedTeacher && (
              <EnrollmentSection1 selectedTeacher={selectedTeacher} selectedLead={selectedLead} setSelectedLead={setSelectedLead} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontDesk_TestAndCouncelling;