import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportCardFull = ({ performance = [], testTypes = [], studentData = {}, schoolDetails = {} }) => {
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('/default-logo.png');

  useEffect(() => {
    const fetchInstituteInfo = async () => {
      try {
        const currentDbName = localStorage.getItem('schoolCode') || schoolDetails.schoolCode;
        if (!currentDbName) return;

        const response = await fetch(`https://cleezoclass.com:4000/api/institute?dbName=${currentDbName}`);
        const data = await response.json();

        setSchoolName(data.institute_name || 'Unknown School');
        setSchoolLogo(data.logo || '/default-logo.png');
      } catch (error) {
        console.error('Error fetching institute info:', error);
        setSchoolName('Unknown School');
        setSchoolLogo('/default-logo.png');
      }
    };

    fetchInstituteInfo();
  }, [schoolDetails.schoolCode]);

  const theme = {
    bg: '#b9c0c7',
    panel: '#e7ebef',
    line: '#4d77a6',
    text: '#173a5f',
    muted: '#6f879a',
    tableHead: '#c7d4de',
    red: '#d84b4b',
  };

  const fallbackTermRows = [
    { key: 'FA1', label: 'FA1', type: 'FA', index: 0 },
    { key: 'FA2', label: 'FA2', type: 'FA', index: 1 },
    { key: 'SA1', label: 'SA1', type: 'SA', index: 0 },
    { key: 'FA3', label: 'FA3', type: 'FA', index: 2 },
    { key: 'FA4', label: 'FA4', type: 'FA', index: 3 },
    { key: 'SA2', label: 'SA2', type: 'SA', index: 1 },
  ];

  const termRows = testTypes.length
    ? testTypes.map((row) => ({
        key: (row.key || row.label || '').toString().trim().toUpperCase(),
        label: row.label || row.key || '',
      }))
    : fallbackTermRows;

  const getPhotoURL = () => {
    if (!studentData.photo) return '';

    let photoPath = studentData.photo;
    if (studentData.photo.data) {
      const byteArray = new Uint8Array(studentData.photo.data);
      photoPath = String.fromCharCode(...byteArray);
    }

    if (typeof photoPath === 'string' && photoPath.startsWith('0x')) {
      photoPath = photoPath
        .match(/.{2}/g)
        .map((byte) => String.fromCharCode(parseInt(byte, 16)))
        .join('');
    }

    return `https://cleezoclass.com:4000${photoPath}`;
  };

  const photoURL = getPhotoURL();
  const resolvedLogo = schoolLogo || schoolDetails.logoSrc || '/default-logo.png';
  const resolvedInstitute = schoolName || schoolDetails.schoolName || schoolDetails.schoolCode || 'ABC SCHOOL';

  const getTestEntry = (subj, row) => {
    if (!subj?.tests || !row?.key) return null;
    if (subj.tests[row.key] !== undefined) return subj.tests[row.key];

    const target = String(row.key).trim().toUpperCase();
    const matchedKey = Object.keys(subj.tests).find((k) => String(k).trim().toUpperCase() === target);
    return matchedKey ? subj.tests[matchedKey] : null;
  };

  const getMark = (subj, row) => {
    const entry = getTestEntry(subj, row);
    if (entry && typeof entry === 'object') {
      if (entry.obtained !== undefined && entry.obtained !== null) return Number(entry.obtained);
      if (entry.marks_obtained !== undefined && entry.marks_obtained !== null) return Number(entry.marks_obtained);
      if (entry.marks !== undefined && entry.marks !== null) return Number(entry.marks);
      return null;
    }

    if (entry !== null && entry !== undefined) {
      const n = Number(entry);
      return Number.isNaN(n) ? null : n;
    }

    if (row.type === 'FA') {
      const n = Number(subj.FA?.[row.index]);
      return Number.isNaN(n) ? null : n;
    }

    if (row.type === 'SA') {
      const n = Number(subj.SA?.[row.index]);
      return Number.isNaN(n) ? null : n;
    }

    return null;
  };

  const getMax = (subj, row) => {
    const entry = getTestEntry(subj, row);
    if (entry && typeof entry === 'object') {
      const raw = entry.max ?? entry.maxMarks ?? entry.total_marks ?? null;
      const n = Number(raw);
      return Number.isNaN(n) ? 0 : n;
    }
    return 0;
  };

  const formatMark = (value) => {
    if (value === null || value === undefined) return '-';
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  };

  const getGrade = (mark) => {
    const m = Number(mark);
    if (Number.isNaN(m)) return '-';
    if (m >= 91) return 'A1';
    if (m >= 81) return 'A2';
    if (m >= 71) return 'B1';
    if (m >= 61) return 'B2';
    if (m >= 51) return 'C1';
    if (m >= 41) return 'C2';
    if (m >= 33) return 'D';
    return 'E';
  };

  const getSubjectMetrics = (subj) => {
    let obtained = 0;
    let max = 0;

    termRows.forEach((row) => {
      const mark = getMark(subj, row);
      const maxMark = getMax(subj, row);
      if (mark !== null && maxMark > 0) {
        obtained += mark;
        max += maxMark;
      }
    });

    const percent = max > 0 ? (obtained / max) * 100 : 0;
    return {
      obtained,
      max,
      percent,
      grade: getGrade(percent.toFixed(1)),
    };
  };

  const overall = (() => {
    if (!performance.length) {
      return {
        totalPerc: '0.0',
        grade: 'N/A',
        chartData: [],
      };
    }

    let totalObtained = 0;
    let totalMax = 0;

    const chartData = performance.map((subj) => {
      let subjObtained = 0;
      let subjMax = 0;

      termRows.forEach((row) => {
        const mark = getMark(subj, row);
        const maxMark = getMax(subj, row);
        if (mark !== null && maxMark > 0) {
          subjObtained += mark;
          subjMax += maxMark;
        }
      });

      totalObtained += subjObtained;
      totalMax += subjMax;

      return {
        name: subj.subject,
        percentage: subjMax > 0 ? Number(((subjObtained / subjMax) * 100).toFixed(1)) : 0,
      };
    });

    const totalPerc = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';
    return {
      totalPerc,
      grade: getGrade(totalPerc),
      chartData,
    };
  })();

  const testAverageData = termRows.map((row) => {
    let obtained = 0;
    let max = 0;

    performance.forEach((subj) => {
      const mark = getMark(subj, row);
      const maxMark = getMax(subj, row);
      if (mark !== null && maxMark > 0) {
        obtained += mark;
        max += maxMark;
      }
    });

    return {
      label: row.label,
      value: max > 0 ? Number(((obtained / max) * 100).toFixed(1)) : 0,
    };
  });

  const skillsBySubject = {
    English: ['Listening', 'Speaking', 'Reading', 'Writing'],
    Telugu: ['Listening', 'Speaking', 'Reading', 'Writing'],
    Hindi: ['Listening', 'Speaking', 'Reading', 'Writing'],
    Maths: ['Understanding', 'Computation', 'Word Problem', 'Logical Thinking'],
    Science: ['Observation', 'Experimentation', 'Concept Clarity', 'Application'],
    Social: ['Map Skills', 'Historical Facts', 'Civic Awareness', 'Geography Understanding'],
  };

  const scholasticSubjects = performance.length
    ? performance.map((s) => s.subject)
    : ['English', 'Telugu', 'Hindi', 'Maths', 'Science', 'Social'];

  const subjectGraphData = scholasticSubjects.map((subject, idx) => {
    const subj = performance.find((s) => s.subject === subject) || performance[idx] || { subject };
    const metrics = getSubjectMetrics(subj);
    return {
      subject,
      obtained: Number(metrics.obtained.toFixed(1)),
      max: Number(metrics.max.toFixed(1)),
      percent: Number(metrics.percent.toFixed(1)),
      grade: metrics.grade,
    };
  });

  return (
    <div
      style={{
        width: '11.69in',
        minHeight: '8.27in',
        margin: '0 auto',
        background: theme.bg,
        padding: '18px',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
      }}
      id="report-card-capture"
    >
      <div
        style={{
          background: '#f3f5f7',
          borderRadius: '14px',
          padding: '14px',
        }}
      >
        <div style={{ border: `3px solid ${theme.line}`, padding: '8px', color: theme.text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `2px solid ${theme.muted}`, paddingBottom: '6px' }}>
            <img
              src={resolvedLogo}
              alt="School Logo"
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover',  }}
            />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '1px' }}>
                <span style={{ color: '#163a5d' }}>{resolvedInstitute}</span>
                {!schoolName && !schoolDetails.schoolName && <span style={{ color: '#6f879a' }}> - Miyapur, Hyderabad</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: '12px' }}>(A CBSE Affiliated Senior Secondary Co-Education English Medium School)</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '6px', fontWeight: 700, fontSize: '18px', color: '#5e7d96' }}>REPORT CARD</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '6px', fontSize: '12px', fontWeight: 700, color: '#6f879a' }}>
            <div>Class : {studentData.class_name || 'VII'}</div>
            <div style={{ textAlign: 'right' }}>(Issued by School as per directives of Central Board of Secondary Education, Delhi)</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.95fr', gap: '8px', marginTop: '8px' }}>
            <div style={{ border: `1px solid ${theme.line}` }}>
              <div style={{ background: theme.tableHead, fontWeight: 700, padding: '4px 6px', fontSize: '12px' }}>Student Profile</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px', padding: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <tbody>
                    <tr><td style={{ fontWeight: 700 }}>Name</td><td>: {studentData.name || '-'}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>Class & Section</td><td>: {studentData.class_name || '-'} {studentData.section || '-'}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>D.O.B</td><td>: {studentData.dob || '-'}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>Father's Name</td><td>: {studentData.father_name || '-'}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>Residential Address</td><td>: {studentData.address || '-'}</td></tr>
                  </tbody>
                </table>
                <div style={{ border: `1px solid ${theme.line}`, width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoURL ? (
                    <img src={photoURL} alt={studentData.name || 'Student'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '12px' }}>PHOTO</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ border: `1px solid ${theme.line}` }}>
              <div style={{ background: theme.tableHead, fontWeight: 700, padding: '4px 6px', fontSize: '12px' }}>Overall Grading</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px' }}></th>
                    {termRows.map((row) => (
                      <th key={row.key} style={{ border: '1px solid #333', padding: '4px' }}>{row.label}</th>
                    ))}
                    <th style={{ border: '1px solid #333', padding: '4px' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #333', padding: '4px', fontWeight: 700 }}>Marks Obtained</td>
                    {testAverageData.map((item) => (
                      <td key={item.label} style={{ border: '1px solid #333', padding: '4px', textAlign: 'center' }}>{item.value}%</td>
                    ))}
                    <td style={{ border: '1px solid #333', padding: '4px', textAlign: 'center' }}>{overall.totalPerc}%</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #333', padding: '4px', fontWeight: 700 }}>Grades</td>
                    {testAverageData.map((item) => (
                      <td key={`g-${item.label}`} style={{ border: '1px solid #333', padding: '4px', textAlign: 'center' }}>{getGrade(item.value)}</td>
                    ))}
                    <td style={{ border: '1px solid #333', padding: '4px', textAlign: 'center', fontWeight: 700 }}>{overall.grade}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <div style={{ border: `1px solid ${theme.line}` }}>
              <div style={{ background: theme.tableHead, fontWeight: 700, padding: '4px 6px', fontSize: '12px' }}>Part1A: Scholastic Area</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px' }}>Subject</th>
                    {termRows.map((row) => (
                      <th key={`h-${row.key}`} style={{ border: '1px solid #333', padding: '4px' }}>{row.label}</th>
                    ))}
                    <th style={{ border: '1px solid #333', padding: '4px' }}>Overall Total</th>
                    <th style={{ border: '1px solid #333', padding: '4px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {scholasticSubjects.map((subject, idx) => {
                    const subj = performance.find((s) => s.subject === subject) || performance[idx] || { subject };
                    const metrics = getSubjectMetrics(subj);
                    return (
                      <tr key={subject + idx}>
                        <td style={{ border: '1px solid #333', padding: '4px', fontWeight: 700 }}>{subject}</td>
                        {termRows.map((row) => {
                          const mark = getMark(subj, row);
                          return (
                            <td key={`${subject}-${row.key}`} style={{ border: '1px solid #333', padding: '4px', textAlign: 'center' }}>
                              {formatMark(mark)}
                            </td>
                          );
                        })}
                        <td style={{ border: '1px solid #333', padding: '4px', textAlign: 'center', fontWeight: 700 }}>
                          {metrics.percent.toFixed(1)}%
                        </td>
                        <td style={{ border: '1px solid #333', padding: '4px', textAlign: 'center', fontWeight: 700 }}>
                          {metrics.grade}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ border: `1px solid ${theme.line}` }}>
              <div style={{ background: theme.tableHead, fontWeight: 700, padding: '4px 6px', fontSize: '12px' }}>Part1B: Co-Scholastic Area</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '4px' }}>Subject</th>
                    <th style={{ border: '1px solid #333', padding: '4px' }}>Sub-Skill 1</th>
                    <th style={{ border: '1px solid #333', padding: '4px' }}>Sub-Skill 2</th>
                    <th style={{ border: '1px solid #333', padding: '4px' }}>Sub-Skill 3</th>
                    <th style={{ border: '1px solid #333', padding: '4px' }}>Sub-Skill 4</th>
                  </tr>
                </thead>
                <tbody>
                  {scholasticSubjects.map((subject, idx) => {
                    const skills = skillsBySubject[subject] || ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4'];
                    return (
                      <tr key={`co-${subject}-${idx}`}>
                        <td style={{ border: '1px solid #333', padding: '4px', fontWeight: 700 }}>{subject}</td>
                        <td style={{ border: '1px solid #333', padding: '4px' }}>{skills[0]}</td>
                        <td style={{ border: '1px solid #333', padding: '4px' }}>{skills[1]}</td>
                        <td style={{ border: '1px solid #333', padding: '4px' }}>{skills[2]}</td>
                        <td style={{ border: '1px solid #333', padding: '4px' }}>{skills[3]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <div style={{ border: `1px solid ${theme.line}`, padding: '6px' }}>
              <div style={{ fontWeight: 700, color: '#5e7d96', marginBottom: '4px' }}>Graphical Report:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#4a657b' }}>
                  <li>Accurate as per performance and marks obtained by the student.</li>
                  <li>No automations or AI tools are used to generate this report.</li>
                </ul>
                <div style={{ width: '100%', height: '95px' }}>
                  <ResponsiveContainer>
                    <BarChart data={subjectGraphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Tooltip
                        formatter={(value, key, payload) => {
                          if (key === "obtained") return [`${value}`, "Marks Obtained"];
                          if (key === "max") return [`${value}`, "Max Marks"];
                          return [value, key];
                        }}
                        labelFormatter={(label, payload) => {
                          const row = payload?.[0]?.payload;
                          return `${label} (Grade: ${row?.grade || "-"})`;
                        }}
                      />
                      <Bar dataKey="max" fill="#9fb3c8" />
                      <Bar dataKey="obtained" fill={theme.red} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ border: `1px solid ${theme.line}`, padding: '6px' }}>
              <div style={{ fontWeight: 700, color: '#5e7d96', marginBottom: '4px' }}>Analytical Report: AI Generated</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#4a657b' }}>
                  <li>Based on marks trend across all exams and subjects.</li>
                  <li>AI generated profile to improve performance.</li>
                </ul>
                <div style={{ width: '100%', height: '95px' }}>
                  <ResponsiveContainer>
                    <BarChart data={subjectGraphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" fontSize={9} />
                      <YAxis domain={[0, 100]} fontSize={9} />
                      <Tooltip
                        formatter={(value, key, payload) => {
                          if (key === "percent") return [`${value}%`, "Percentage"];
                          return [value, key];
                        }}
                        labelFormatter={(label, payload) => {
                          const row = payload?.[0]?.payload;
                          return `${label} (Grade: ${row?.grade || "-"})`;
                        }}
                      />
                      <Bar dataKey="percent" fill={theme.red} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '8px', border: `1px solid ${theme.line}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '13px', fontWeight: 700, textAlign: 'center', padding: '6px 0' }}>
            <div>CLASS TEACHER</div>
            <div>EXAMINATION IC</div>
            <div>PRINCIPAL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardFull;
