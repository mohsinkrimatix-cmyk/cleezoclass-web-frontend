import React, { useEffect, useState } from 'react';
import axios from 'axios';

const IMAGE_BASE_URL = "https://cleezoclass.com:4000";

const TeacherDashboard = () => {
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTabs, setActiveTabs] = useState({});
  const [reasonMap, setReasonMap] = useState({});
  const [submittedDecisions, setSubmittedDecisions] = useState({});
  
  const name = localStorage.getItem("name");
  const schoolCode = localStorage.getItem("schoolCode");

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return isNaN(date) ? dateStr : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teacherRes = await axios.get('https://cleezoclass.com:4000/teachers', { params: { schoolCode } });
        const currentTeacher = teacherRes.data.find(t => t.name === name);
        setTeacherProfile(currentTeacher);

        const leadsRes = await axios.get("https://cleezoclass.com:4000/api/api/assigned-leads", {
          params: { schoolCode, teacherName: name }
        });
        
        if (leadsRes.data.success) {
          setLeads(leadsRes.data.leads);
          const initialTabs = {};
          leadsRes.data.leads.forEach(l => initialTabs[l.id] = 'test');
          setActiveTabs(initialTabs);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [schoolCode, name]);

  const handleDecision = async (leadId, category, decision) => {
    const reason = reasonMap[leadId]?.[category] || "";
    if (!reason) return alert(`Please provide a reason.`);

    try {
      const res = await axios.post("https://cleezoclass.com:4000/api/api/teacher-decision", {
        schoolCode, leadId, teacherName: name, decisionType: category, decision, reason
      });

      if (res.data.success) {
        setSubmittedDecisions(prev => ({
          ...prev,
          [leadId]: { 
            ...prev[leadId], 
            [`${category}Decision`]: decision, 
            [`${category}Reason`]: reason,
            [`${category}Done`]: true 
          }
        }));
      }
    } catch (err) { alert("Submission failed"); }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'left' }}>Loading...</div>;

  return (
    <div style={containerStyle}>
            <div style={mainUnifiedContainer}>

      {/* TEACHER PROFILE */}
      {teacherProfile && (
             <div style={headerSection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={avatarStyle}>
              {teacherProfile?.photo ? (
                <img src={`${IMAGE_BASE_URL}${teacherProfile.photo}`} alt="P" style={imgStyle} />
              ) : (
                <span>{name?.charAt(0)}</span>
              )}
            </div>
            <div>
                <div style={profileTextJustify}>

              <h1 style={titleStyle}>{teacherProfile?.name}</h1>
          <p style={subtitleStyle}>
 subject: {teacherProfile?.subject}
</p>

<p style={subtitleStyle}>
  Assigned classes: {teacherProfile?.class}
</p>

<p style={subtitleStyle}>
  Phone: {teacherProfile?.phone_no}
</p>

            </div></div>
          </div>
          
          <div style={statsBox}>
            <div style={{textAlign: 'right'}}>
              <span style={statLabel}>Total Leads</span>
              <div style={statValue}>{leads.length}</div>
            </div>
          </div>
        </div>

      )}

      <h2 style={{ fontSize: '18px', marginBottom: '15px' ,marginTop:'15px', textAlign:'center'}}>Assigned Leads</h2>

      {/* SCROLLABLE AREA: Fixed height to show roughly one row */}
      <div style={scrollContainerStyle}>
        <div style={gridStyle}>
          {leads.map(lead => {
            const currentTab = activeTabs[lead.id] || 'test';
            const submission = submittedDecisions[lead.id] || {};
            const isTestDone = submission.testDone || (lead.teacher_decision && lead.teacher_decision !== "Pending");
            const isCounsellingDone = submission.counsellingDone;

            return (
              <div key={lead.id} style={cardStyle}>
                <div style={tabNavStyle}>
                  <button onClick={() => setActiveTabs({...activeTabs, [lead.id]: 'test'})} style={tabButtonStyle(currentTab === 'test')}>
                    Test {isTestDone && "✓"}
                  </button>
                  {lead.counselling_required === "Yes" && (
                    <button onClick={() => setActiveTabs({...activeTabs, [lead.id]: 'counselling'})} style={tabButtonStyle(currentTab === 'counselling')}>
                      Counseling {isCounsellingDone && "✓"}
                    </button>
                  )}
                </div>

                <div style={{ padding: '15px' }}>
                  {currentTab === 'test' ? (
                    <div>
                      <p style={detailStyle}><strong>Student:</strong> {lead.student_name}</p>
                                            <p style={detailStyle}><strong>Mode:</strong> {lead.test_mode}</p>

                      <p style={detailStyle}><strong>Time:</strong> {formatDate(lead.test_date)} {formatTime(lead.test_time)}</p>
                      {isTestDone ? (
                        <div style={resultStyle(submission.testDecision || lead.teacher_decision)}>
                          {submission.testDecision || lead.teacher_decision}: {submission.testReason || lead.teacher_reason}
                        </div>
                      ) : (
                        <>
                          <textarea placeholder="Reason..." onChange={(e) => setReasonMap({...reasonMap, [lead.id]: {...reasonMap[lead.id], test: e.target.value}})} style={inputStyle} />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleDecision(lead.id, 'test', 'Accepted')} style={{ ...actionBtn, backgroundColor: '#10b981' }}>Accept</button>
                            <button onClick={() => handleDecision(lead.id, 'test', 'Rejected')} style={{ ...actionBtn, backgroundColor: '#ef4444' }}>Reject</button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p style={detailStyle}><strong>Counseling:</strong> {formatDate(lead.counselling_date)}</p>
                      {isCounsellingDone ? (
                        <div style={resultStyle(submission.counsellingDecision)}>
                          {submission.counsellingDecision}: {submission.counsellingReason}
                        </div>
                      ) : (
                        <>
                          <textarea placeholder="Reason..." onChange={(e) => setReasonMap({...reasonMap, [lead.id]: {...reasonMap[lead.id], counselling: e.target.value}})} style={inputStyle} />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleDecision(lead.id, 'counselling', 'Accepted')} style={{ ...actionBtn, backgroundColor: '#3b82f6' }}>Accept</button>
                            <button onClick={() => handleDecision(lead.id, 'counselling', 'Rejected')} style={{ ...actionBtn, backgroundColor: '#6366f1' }}>Reject</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div></div>
  );
};
const titleStyle = { margin: 0, fontSize: '22px', color: '#1a202c', fontWeight: '800' };
const subtitleStyle = { margin: '4px 0 0', fontSize: '14px', color: '#718096' };

const statsBox = { padding: '10px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #edf2f7' };
const statLabel = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a0aec0', fontWeight: 'bold' };
const statValue = { fontSize: '24px', fontWeight: '800', color: '#2d3748' };
const containerStyle = {
  minHeight: '100vh',           // full screen height
  display: 'flex',
  justifyContent: 'center',     // vertical center
  alignItems: 'center',         // horizontal center
  padding: '20px',
  fontFamily: '"Inter", sans-serif',
  backgroundColor: '#f8fafc' ,
  maxWidth:'100vw'   // optional (nice contrast)
};

const mainUnifiedContainer = {
width:'80vw'   , margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    overflow: 'hidden', // Keeps the inner sections contained
    border: '1px solid #e2e8f0'
};
// Fixed height container for scrolling
const scrollContainerStyle = {
  maxHeight: '300px', // Adjust this height based on your card size to show exactly 1 row
  overflowY: 'auto',
  paddingRight: '10px',
  border: '1px solid #edf2f7',
  borderRadius: '12px',
  padding: '15px',
  backgroundColor: '#f8fafc',
  justifyContent:'flex-start',
  textAlign:'left'
};
const headerSection = {
  display: 'flex',
  justifyContent: 'space-between', // 👈 left + right
  alignItems: 'center',
  padding: '30px',
  backgroundColor: '#fff',
  borderBottom: '1px solid #f1f5f9',
};
const profileTextJustify = {
  textAlign: 'justify',
  maxWidth: '320px',   // important for proper justification
};

const profileHeaderStyle = { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '20px' };
const avatarStyle = { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ebf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', justifyContent:'flex-start', textAlign:'left' };
const cardStyle = { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' };
const tabNavStyle = { display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 15px' };
const tabButtonStyle = (active) => ({ padding: '10px', border: 'none', background: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: active ? '#4a90e2' : '#94a3b8', borderBottom: active ? '2px solid #4a90e2' : '2px solid transparent' });
const detailStyle = { fontSize: '13px', margin: '5px 0', color: '#475569' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', minHeight: '60px', marginBottom: '10px', boxSizing: 'border-box', resize: 'none' };
const actionBtn = { flex: 1, padding: '10px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const resultStyle = (dec) => ({ padding: '10px', borderRadius: '8px', fontSize: '12px', backgroundColor: dec === 'Accepted' ? '#f0fdf4' : '#fef2f2', color: dec === 'Accepted' ? '#166534' : '#991b1b', border: '1px solid currentColor' });

export default TeacherDashboard;