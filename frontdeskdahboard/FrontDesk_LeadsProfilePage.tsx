import React, { useEffect, useState, CSSProperties } from "react";
import axios from "axios";
import { FaUser } from "react-icons/fa";
import { format } from "date-fns"; // for formatting dates
import './FrontDesk_LeadsProfilePage.css'


// --- Interfaces ---
interface Lead {
  id: string | number;
  full_name: string;
  email_id?: string;
  mobile_number?: string;
  reg_no?: string;
  address?: string;
  lead_admission_for?: string;
  ticket_no?: string;
  date?: string;
  lead_time?: string;
  assigned_teacher_name?: string;
  entry_type?: string;
  test_type?: string;
  test_date?: string;
  total_marks?:string;
  test_score?:string;
}
interface Teacher {
  name: string;
  subject: string;
  designation:string
}
interface Feedback {
  marks: number;
  user_name: string;
  student_class: string;
}

// --- Reusable Styles ---
const cardStyle: CSSProperties = {
  padding: '15px',
  marginBottom: '20px',
  borderRadius: '26px',
  backgroundColor: '#fff',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', 
  border:'4px solid #ccc',
  width:'28vw'
};
const cardStyle2: CSSProperties = {
  padding: '15px',
  marginBottom: '20px',
  borderRadius: '26px',
  backgroundColor: 'transparent',
  border:'4px solid #ccc'
};
const cardStyle1: CSSProperties = {
  padding: '15px',
  marginBottom: '20px',
  borderRadius: '16px',
};
const dataFieldStyle: CSSProperties = {
  paddingBottom: '3px',
  marginBottom: '10px',
  fontWeight: '600',
  fontSize: '14px',
};
const boldTextStyle1: CSSProperties = {
  fontWeight: 'bold',
  fontSize:'30px'
};
const boldTextStyle: CSSProperties = {
  fontWeight: 'bold',
};

// --- Sub-Components ---

// 1. Top Left Card (Lead Summary)
interface LeadSummaryProps {
  lead: Lead | null;
  score: number;
  strength: number;
}

const LeadSummarySection: React.FC<LeadSummaryProps> = ({ lead, score, strength }) => (
  <div className="lp-lead-summary-card">
    {/* Lead Info */}
    <div className="lp-lead-summary-info">
      <div className="lp-lead-summary-header">
        <div className="lp-lead-avatar">
          <FaUser size={28} color={"#404040"} />
        </div>
        <div className="lp-lead-details">
          <p className="lp-lead-name">{lead?.full_name || "lp-SELECT A LEAD"}</p>
          <p className="lp-lead-email">
            <a href={`mailto:${lead?.email_id || "xxxx@gmail.com"}`}>
              {lead?.email_id || "xxxx@gmail.com"}
            </a>
          </p>
          <p className="lp-lead-mobile">MOBILE: {lead?.mobile_number || "xxxxxxxxxx"}</p>
          <p className="lp-lead-reg">REG: {lead?.reg_no || "N/A"}</p>
        </div>
      </div>

      <div className="lp-lead-summary-extra">
        <p>Address: {lead?.address || "N/A"}</p>
        <p>Class To: {lead?.lead_admission_for || "N/A"}</p>
        <p>Ticket No: <b>{lead?.ticket_no || "N/A"}</b></p>
        <p>Added On: <b>{lead?.date ? new Date(lead.date).toLocaleDateString() : "26/10/2025"}</b> {lead?.lead_time || "10:30AM"}</p>
      </div>
    </div>

    {/* Score & Strength */}
    <div className="lp-lead-summary-stats">
      <div className="lp-lead-summary-score">
        {score || 0}<br />SCORE
      </div>
      <div className="lp-lead-summary-score">
        {strength || 0}%<br />STRENGTH
      </div>
    </div>
  </div>
);

const LeadProgressSection: React.FC<{
  lead: Lead | null;
  selectedTeacher?: Teacher;
}> = ({ lead, selectedTeacher }) => {
  if (!lead) return null;

  return (
    <div className="lp-lead-info-card">
      {/* Top Row */}
      <div className="lp-lead-info-header">
        <div className="lp-lead-info-title">Lead Information</div>
        <div className="lp-lead-info-shortlisted">
          <div className="lp-shortlisted-label">Shortlisted</div>
          <div className="lp-shortlisted-date">
            {new Date(lead.date).toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="lp-lead-info-name">
        <b>Name:</b> <span>{lead.assigned_teacher_name}</span>
      </div>

      <div className="lp-lead-info-class">
        <b>Class:</b> {selectedTeacher?.designation || "N/A"}
      </div>

      {/* rest of your markup */}
    </div>
  );
};

// 3. Bottom Right Section (Timeline)
interface TimelineEventProps {
  date: string;
  time: string;
  description: string;
}
const TimelineEvent: React.FC<TimelineEventProps> = ({ date, time, description }) => (
  <div className="lp-timeline-event">
    <div className="lp-timeline-date">
      {date}
      <br />
      {time}
    </div>
    <div className="lp-timeline-desc">{description}</div>
  </div>
);

const LeadTimeline: React.FC<{ lead: Lead | null }> = ({ lead }) => (
  <div className="tc-sectionContainer">
     <h3 className="lp-lead-timeline-title">Timeline</h3>
    <div className="lp-timeline-wrapper">
      <TimelineEvent
        date={lead?.date ? new Date(lead.date).toLocaleDateString() : "25/11/2025"}
        time={lead?.lead_time || "12:29:10"}
        description={
          lead
            ? `System update for ${lead.full_name}`
            : "VISHAL (Counselor) sent an email to IFTEQAR BANU."
        }
      />
    </div>
  </div>
);

interface RegisteredCountProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  selectedLeadId: string | number | undefined;
}

const LeadsRegisteredCount: React.FC<RegisteredCountProps> = ({
  leads,
  onSelectLead,
  selectedLeadId,
}) => {
  const [regFilter, setRegFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Filter leads
const filteredLeads = leads.filter((lead) => {
  const matchesReg = (lead.reg_no || "")
    .toLowerCase()
    .includes(regFilter.toLowerCase());

  const matchesDate = dateFilter
    ? lead.date === dateFilter
    : true;

  return matchesReg && matchesDate;
});

  return (
    <div className="tc-sectionContainer1">
  <div className="tc-staffAssignSection">
    {/* Header: Count left, Filters right */}
    <div className="lp-leads-card-header">
      {/* Leads Count */}
      <p className="lp-leads-count">
        <span className="lp-leads-count-number">{filteredLeads.length}</span> Leads Registered
      </p>

      {/* Filters */}
      <div className="lp-leads-filters">
        <input
          type="text"
          placeholder="Filter by Reg No"
          value={regFilter}
          onChange={(e) => setRegFilter(e.target.value)}
          className="lp-filter-input"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="lp-filter-input"
        />
      </div>
    </div>

    {/* Leads Grid */}
    <div className="lp-leads-grid">
      {filteredLeads.map((lead) => (
        <div
          key={lead.id}
          onClick={() => onSelectLead(lead)}
          className={`lp-lead-card ${selectedLeadId === lead.id ? "lp-selected" : ""}`}
        >
          <div className="lp-lead-avatar">
            <FaUser
              size={28}
              color={selectedLeadId === lead.id ? "#e59143ff": "#404040"}
            />
          </div>
          <div className="lp-lead-name">{lead.full_name}</div>
          <div className="lp-lead-info">
            <p>
              REG: <span>{lead?.reg_no || "N/A"}</span>
            </p>
            <p>
              Date: <span>{lead.date ? format(new Date(lead.date), "dd/MM/yyyy") : "N/A"}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  </div></div>
);

};
// --- Main Page Component ---
const LeadProfilePage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");

    const fetchLeads = async () => {
      try {
        const response = await axios.get<Lead[]>(
          "https://cleezoclass.com:4000/api/api/leads",
          {
            params: { schoolCode: schoolCode },
          }
        );
        const data = Array.isArray(response.data) ? response.data : [];
        setLeads(data);
        if (data.length > 0) setSelectedLead(data[0]);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchLeads();
  }, []);

  // Score from leads table
  const calculateScore = (): number => {
    if (!selectedLead) return 0;
    return selectedLead.test_score || 0; // use test_score directly
  };

  const calculateStrength = (): number => {
    if (!selectedLead || !selectedLead.total_marks) return 0;
    const percentage = (selectedLead.test_score / selectedLead.total_marks) * 100;
    return Math.round(percentage);
  };

  return (
  <div className="lp-lead-profile-container">
    <h2 className="lp-lead-profile-title">LEAD PROFILE</h2>

    <div className="lp-lead-profile-grid">
      <div className="lp-lead-profile-left">
        <LeadSummarySection
          lead={selectedLead}
          score={calculateScore()}
          strength={calculateStrength()}
        />
        <LeadsRegisteredCount
          leads={leads}
          onSelectLead={setSelectedLead}
          selectedLeadId={selectedLead?.id}
        />
      </div>

      <div className="lp-lead-profile-right">
        <LeadProgressSection lead={selectedLead} />
        <LeadTimeline lead={selectedLead} />
      </div>
    </div>
  </div>
);

};

export default LeadProfilePage;