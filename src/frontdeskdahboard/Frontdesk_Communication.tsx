import React, { useState, useEffect, useRef, ChangeEvent, CSSProperties } from "react";
import '../STYLES/solidbutton.css';
import './Frontdesk_Communication.css'
import './FrontDesk_TestAndCouncelling.css';
import axios from "axios";
import { FaUser } from "react-icons/fa";
import Select, { MultiValue } from "react-select";
import ErrorPopup from "../shared/ErrorPopup";

// --- Interfaces ---
interface Lead {
  id: string | number;
  full_name: string;
  mobile_number: string;
  email_id?: string;
  lead_admission_for?: string;
  date: string;
  lead_time: string;
  entry_type?: string;
  assigned_teacher_name?: string;
  reg_no?: string | number;
  channel?: string;
  channels?: string[];
}

interface Teacher {
  name: string;
  subject: string;
}

interface ChannelOption {
  value: string;
  label: string;
}

const API_BASE_URL = 'https://cleezoclass.com:4000/api';

// --- Utility Styles ---
const styles: { [key: string]: CSSProperties | any } = {
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
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
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
    height: '25vh',
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

const Section: React.FC<{ title: string; children: React.ReactNode; variant?: string; style?: CSSProperties }> = ({ title, children, variant = "default", style = {} }) => {
  const compactVariants = ["lead", "marketing"];
  const containerStyle = compactVariants.includes(variant)
    ? styles.sectionContainer1
    : styles.sectionContainer;

  return (
    <div className={compactVariants.includes(variant) ? "co-sectionContainer1" : "co-sectionContainer"} style={style}>
  <div className="co-sectionTitle">{title}</div>
  {children}
</div>

  );
};

const EnrollmentSection1: React.FC<{ selectedLead: Lead | null; setSelectedLead: (lead: Lead) => void }> = ({ selectedLead, setSelectedLead }) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const schoolCode = localStorage.getItem("schoolCode");

  useEffect(() => {
    if (!schoolCode) return;
    fetch(`${API_BASE_URL}/communication/leads?schoolCode=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => setLeads(data))
      .catch((err) => console.error("Fetch Error:", err));
  }, [schoolCode]);

  const filteredLeads = leads.filter((lead) => {
    if (!selectedDate) return true;
    const leadDate = new Date(lead.date).toISOString().split("T")[0];
    return leadDate === selectedDate;
  });

  useEffect(() => {
    if (!selectedLead && filteredLeads.length > 0) {
      setSelectedLead(filteredLeads[0]);
    }
  }, [filteredLeads, selectedLead, setSelectedLead]);

  const groupedLeads = Object.values(
    filteredLeads.reduce((acc: { [key: string]: Lead }, lead) => {
      if (!acc[lead.id]) {
        acc[lead.id] = {
          ...lead,
          channels: lead.channel ? [lead.channel] : [],
        };
      } else {
        if (lead.channel && !acc[lead.id].channels?.includes(lead.channel)) {
          acc[lead.id].channels?.push(lead.channel);
        }
      }
      return acc;
    }, {})
  );

  const statusColor = (lead: Lead) => (lead.channels && lead.channels.length > 0 ? "#007bff" : "#dc3545");

  return (
  <Section title="" variant="lead">
  {/* HEADER ROW: TITLE + DATE FILTER */}
  <div className="co-timeline-header">
    <div className="co-timeline-header-title">
      Timeline – All Leads
    </div>
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="co-date-input"
    />
  </div>

  {filteredLeads.length === 0 && (
    <p className="co-no-leads-text">No leads found.</p>
  )}

  {groupedLeads.map((lead, index) => {
    const formattedDate = new Date(lead.date).toISOString().split("T")[0];
    const hasChannels = lead.channels && lead.channels.length > 0;
    const statusLabel = hasChannels ? "REGISTERED" : "CANCELLED";
    const statusClass = hasChannels ? "timeline-status-registered" : "timeline-status-cancelled";

    return (
      <div
        key={lead.id}
        className="co-timeline-item"
        onClick={() => setSelectedLead(lead)}
      >
        {index !== filteredLeads.length - 1 && <div className="co-timeline-connector" />}
        <div className="co-timeline-row">
          <div className="co-timeline-date">
            <div className="co-timeline-date-text">{formattedDate}</div>
            <div className="co-timeline-time-text">{lead.lead_time}</div>
          </div>

            <div className="co-lead-avatar">
            <FaUser size={18} color="#404040" />
          </div>

          <div className="co-timeline-details">
            <div className={`co-timeline-status ${statusClass}`}>
              {statusLabel}
            </div>

            <span className="co-timeline-name">{lead.full_name}</span>{" "}
            class: {lead?.lead_admission_for || "N/A"},{" "}
            Contact <b>{lead.mobile_number}</b>,{" "}
            {lead?.email_id || "xxxx@gmail.com"}
            <br />
            Lead Source <b>{lead.entry_type?.toUpperCase()}</b>, Communication:{" "}
            {hasChannels ? (
              lead.channels.map((ch, idx) => (
                <span key={idx} className="co-timeline-channel">
                  {ch.toUpperCase()}
                </span>
              ))
            ) : (
              <span className="co-timeline-channel-empty">selected</span>
            )}
          </div>
        </div>
      </div>
    );
  })}
</Section>

  );
};

const LeadProgressSection: React.FC<{
  lead: Lead | null;
  selectedTeacher?: Teacher;
}> = ({ lead, selectedTeacher }) => {
  if (!lead) return null;

  return (
    <Section title="" variant="lead">
      <div className="co-lead-progress-container">
        {/* Top Row: Lead Information + Shortlisted */}
        <div className="co-lead-progress-header">
          <div className="co-lead-progress-title">Lead Information</div>
          <div className="co-lead-progress-status">
            <div className="co-lead-progress-status-title">Shortlisted</div>
            <div className="co-lead-progress-date">
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
        <div className="co-lead-progress-name">
          <b>Name:</b>{" "}
          <span className="co-lead-progress-name-value">{lead.full_name}</span>
        </div>

        {/* Class, Contact, Email */}
        <div className="co-lead-progress-meta">
          <b>Class:</b> {lead.lead_admission_for} | {lead.mobile_number} |{" "}
          {lead.email_id}
        </div>

        {/* Row 1 */}
        <div className="co-lead-progress-row">
          {/* Assigned Counselor */}
          <div className="co-lead-progress-col">
            <div className="co-lead-progress-label">Assigned Counselor</div>
            <div className="co-lead-progress-text">
              <div>Name: {lead.assigned_teacher_name}</div>
              <div>Subject: {selectedTeacher?.subject || "N/A"}</div>
            </div>
          </div>

          {/* Communication Status */}
          <div className="co-lead-progress-col">
            <div className="co-lead-progress-label">Communication Status</div>
            <div className="co-lead-progress-text">
              <div>Email Sent: 10</div>
              <div>WhatsApp Sent: 20</div>
            </div>
          </div>

          {/* Details */}
          <div className="co-lead-progress-col">
            <div className="co-lead-progress-label">Details</div>
            <div className="co-lead-progress-text">
              <div>Class To: 9</div>
              <div>School: TSMS</div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="co-lead-progress-row">
          {/* Lead Source */}
          <div className="co-lead-progress-col">
            <div className="co-lead-progress-label">Lead Source</div>
            <div className="co-lead-progress-text">
              <div>
                Adds:{" "}
                {["manual", "automatic"].includes(
                  lead.entry_type?.toLowerCase()
                )
                  ? "Walk-in"
                  : lead.entry_type}
              </div>
            </div>
          </div>

          {/* Telephonic */}
          <div className="co-lead-progress-col lead-progress-telephonic">
            <div className="co-lead-progress-label">Telephonic</div>
            <div className="co-lead-progress-text">
              <div>Incoming: 10</div>
              <div>Outgoing: 20</div>
            </div>
          </div>

          {/* Empty spacer column */}
          <div className="co-lead-progress-col" />
        </div>
      </div>
    </Section>
  );
};


const MarketingStatus: React.FC<{ leads: Lead[]; setLeads: (leads: Lead[]) => void; onSelectLead: (lead: Lead) => void; selectedLead: Lead | null }> = ({ leads, setLeads, onSelectLead, selectedLead }) => {
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    fetch(`${API_BASE_URL}/api/leads?schoolCode=${schoolCode}`)
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        if (data.length > 0 && !selectedLead) onSelectLead(data[0]);
      })
      .catch(err => console.error(err));
  }, []);

  const filteredLeads = leads.filter(lead => !selectedDate || new Date(lead.date).toISOString().split("T")[0] === selectedDate);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
  <Section title="" variant="lead">
    {/* DATE FILTER */}
    <div className="co-lead-header">
      {/* TITLE */}
      <div className="co-lead-title">Registered Leads</div>

      {/* DATE FILTER */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="co-date-input"
      />
    </div>

    {filteredLeads.length === 0 && (
      <p className="co-no-leads-text">No leads found for selected date.</p>
    )}

    {filteredLeads.map((lead, index) => {
      const formattedDate = new Date(lead.date).toISOString().split("T")[0];

      return (
        <div
          key={lead.id}
          onClick={() => onSelectLead(lead)}
          className={`co-lead-item ${
            selectedLead?.id === lead.id ? "co-lead-item-active" : ""
          }`}
        >
          {index !== filteredLeads.length - 1 && (
            <div className="co-lead-vertical-line" />
          )}

          <div className="co-lead-row">
            {/* DATE */}
            <div className="co-lead-date">
              <div className="co-lead-date-text">{formattedDate}</div>
              <div className="co-lead-time-text">{lead.lead_time}</div>
            </div>

            {/* USER ICON */}
            <div className="co-lead-avatar">
              <FaUser size={18} color="#404040" />
            </div>

            {/* DETAILS */}
            <div className="co-lead-details">
              <span className="co-lead-name">{lead.full_name}</span>{" "}
              class: {lead?.lead_admission_for || "N/A"},{" "}
              Contact <b>{lead.mobile_number}</b>
              <br />
              <a
                href={`mailto:${lead?.email_id || "xxxx@gmail.com"}`}
                className="co-lead-email"
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
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
};

export const EnrollmentSection: React.FC<{
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onRegisterCommunication: (data: any) => void;
}> = ({ leads, selectedLead, onSelectLead }) => {
  const [commDate, setCommDate] = useState<string>("");
  const [commTime, setCommTime] = useState<string>("");
  const [channels, setChannels] = useState<string[]>([]);
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterRegNo, setFilterRegNo] = useState<string>("");
  const popupRef = useRef<HTMLDivElement>(null);

  const channelOptions: ChannelOption[] = [
    { value: "Facebook", label: "facebook" },
    { value: "WhatsApp", label: "Whatsapp" },
    { value: "Mail", label: "Gmail" },
    { value: "All", label: "All" },
  ];
  const [errorMsg, setErrorMsg] = useState("");

const handleRegister = () => {
  try {
    const missingFields = [];

    if (!commDate) missingFields.push("communication date");
    if (!commTime) missingFields.push("communication time");
    if (channels.length === 0) missingFields.push("at least one communication channel");
    if (!selectedLead) missingFields.push("a lead");

    if (missingFields.length > 0) {
      setErrorMsg(
        `Kindly select ${missingFields.join(", ")} to proceed.`
      );
      return;
    }

    const schoolCode = localStorage.getItem("schoolCode");
    const schedule = [];
    const startDate = new Date(commDate + "T" + commTime);

    for (let i = 0; i < 30; i++) {
      const sendDate = new Date(startDate);
      sendDate.setDate(startDate.getDate() + i);

      schedule.push({
        leadId: selectedLead.id,
        leadName: selectedLead.full_name,
        phone: selectedLead.mobile_number,
        email: selectedLead.email_id,
        date: sendDate.toISOString().split("T")[0],
        time: sendDate.toTimeString().split(" ")[0],
        channels,
        message: "Your daily advertisement",
        schoolCode,
      });
    }

    axios
      .post(`${API_BASE_URL}/schedule-messages`, { schedule, schoolCode })
      .then(() => {
        setErrorMsg("Communication has been successfully scheduled for the next 30 days.");
        setPopupVisible(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Unable to schedule messages at this moment. Kindly try again later.");
      });
  } catch (error) {
    console.error(error);
    setErrorMsg("Something went wrong while scheduling communication. Please try again.");
  }
};


  const filteredLeads = leads.filter((lead) => {
    const matchRegNo =
      !filterRegNo || lead.reg_no?.toString().includes(filterRegNo);
    const matchDate = !filterDate || lead.date.split("T")[0] === filterDate;
    return matchRegNo && matchDate;
  });

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setPopupVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

 return (
  <div className="tc-sectionContainer">
    <div className="tc-sectionTitle">Communication Assign</div>
    <div className="co-section-container">
    <div className="co-wrapper">
      {/* Filter Row */}
      <div className="co-filter-row">
        <div className="co-filter-title">Communication Assign</div>
        <div className="co-filter-inputs">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="co-date-input"
          />
          <input
            type="text"
            placeholder="Reg No"
            value={filterRegNo}
            onChange={(e) => setFilterRegNo(e.target.value)}
            className="co-date-input"
          />
        </div>
      </div>

      {/* Lead Grid */}
      <div className="co-lead-grid">
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => {
              onSelectLead(lead);
              setPopupVisible(true);
            }}
            className="co-lead-card"
          >
            <div className="co-lead-avatar-assign">
              <FaUser
                size={35}
                color={selectedLead?.id === lead.id ? "#e59143ff" : "#404040"}
              />
            </div>
            <div className="co-lead-name">{lead.full_name}</div>
          </div>
        ))}
      </div>


    </div>
    </div>
                <ErrorPopup message={errorMsg} onClose={() => setErrorMsg("")} />
      {/* Popup */}
      {selectedLead && popupVisible && (
        <div ref={popupRef} className="co-popup">
          <div className="co-popup-title">Communications</div>

          {/* Date & Time side by side */}
          <div className="co-popup-datetime">
            <input
              type="date"
              value={commDate}
              onChange={(e) => setCommDate(e.target.value)}
              className="co-popup-input"
            />
            <input
              type="time"
              value={commTime}
              onChange={(e) => setCommTime(e.target.value)}
              className="co-popup-input"
            />
          </div>

          {/* Channel & Button side by side */}
          <div className="co-popup-channel">
            <div className="co-popup-input">
              <Select
                isMulti
                options={channelOptions}
                onChange={(selected: MultiValue<ChannelOption>) =>
                  setChannels(selected.map((s) => s.value))
                }
              />
            </div>
            <button onClick={handleRegister} className="co-popup-btn">
              Register
            </button>
          </div>
        </div>
      )}
  </div>
);

};

const Frontdesk_Communication: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  return (
<div className="co-container">
  <div className="co-mainGrid">
    <div className="co-processHeading">Communications</div>
    <div className="co-row">
          <MarketingStatus leads={leads} setLeads={setLeads} onSelectLead={setSelectedLead} selectedLead={selectedLead} />
          <LeadProgressSection lead={selectedLead} />
        </div>
    <div className="co-row">
          <EnrollmentSection leads={leads} selectedLead={selectedLead} onSelectLead={setSelectedLead} onRegisterCommunication={(d) => console.log(d)} />
          <EnrollmentSection1 selectedLead={selectedLead} setSelectedLead={setSelectedLead} />
        </div>
      </div>
    </div>
  );
};

export default Frontdesk_Communication;