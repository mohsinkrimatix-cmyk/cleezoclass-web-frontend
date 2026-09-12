import React from 'react';
// Assuming 'download.png' is the school logo as used in your original file.
// If you have a different image for the CBSE logo, you'd need to import that too.
import schoolLogo from '../assets/download.png'; 

const ReportCardPortrait = () => {
    // Colors based on the screenshot image and your original file
    const COLOR_HEADER_BG = 'rgb(145, 167, 175)'; // Light Slate Gray / Blue-Gray for headers
    const COLOR_BORDER = '#325490'; // Navy/Dark Blue for main borders
    const COLOR_TEXT = 'rgb(62, 80, 99)'; // Dark Blue/Gray for school name
    const COLOR_SUB_TEXT = 'rgb(128, 149, 160)'; // Medium Blue-Gray for minor text/titles

    // Grade Scale Colors (Approximation from image)
    const COLOR_GRADE_A = '#90EE90'; // Light Green
    const COLOR_GRADE_B = '#ADD8E6'; // Light Blue
    const COLOR_GRADE_C = '#F0E68C'; // Khaki/Yellow
    const COLOR_GRADE_D = '#FFD700'; // Gold
    const COLOR_GRADE_E = '#FF6347'; // Tomato/Red

    // Base Styles (Updated for the image's aesthetic)
    const baseStyles = {
        page: {
            fontFamily: 'Liberation Serif, Arial, sans-serif', // Using a serif font to match the image, if not available, Arial is fallback
            fontSize: '9.5px', // Slightly adjusted for dense content
            margin: '0 auto',
            padding: '10px',
            border: `2px solid ${COLOR_BORDER}`,
            width: '8.5in',  // Portrait width
            minHeight: '10in',  // Portrait height
            boxSizing: 'border-box',
            backgroundColor: '#fff',
        },
        schoolName: {
            fontSize: '24px', // Smaller to fit
            fontWeight: 'bold',
            color: COLOR_TEXT,
            margin: '0',
            lineHeight: '1',
        },
        reportCardTitle: {
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '2px 0',
            margin: '5px 0',
            textAlign: 'center',
            color: COLOR_SUB_TEXT,
        },
        sectionTitle: {
            fontWeight: 'bold',
            fontSize: '10px',
            padding: '2px 0',
            margin: '5px 0',
            color: 'black', // Set to black to match image's section title
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '5px',
        },
        th: {
            border: '1px solid #000',
            padding: '2px',
            textAlign: 'center',
            backgroundColor: COLOR_HEADER_BG,
            fontWeight: 'bold',
            fontSize: '7px', // Smaller font for header rows
            whiteSpace: 'nowrap', // Prevent wrapping
        },
        td: {
            border: '1px solid #000',
            padding: '2px',
            textAlign: 'left',
            fontSize: '7px',
        },
    };

    // --- Content Data (Based on Screenshot) ---
    const studentData = {
        name: 'J. Sudhansh Reddy',
        rollNo: '120',
        classSection: 'X-A',
        admissionNo: '625/2013',
        dob: '01 March 2012',
        cbseRegNo: '...',
        fathersName: 'J. Amarender Reddy',
        contactNo: '9800540748',
        address: 'Flat No. 402, Divya Apt., Pragathi Colony, Miyapur, Hyderabad, Telangana'
    };

    const overallGradingData = {
        academicGrade: 'A1',
        result: 'PAS S',
    };

    // Subjects in the Scholastic Area table
    const scholasticSubjects = [
        'English - I', 'English - II', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'General Knowledge', 'Moral Science'
    ];

    // Placeholder data for Scholastic table (must fill all 16 columns per row)
    const getPlaceholderCell = (subject, colIndex) => {
        // Simple pattern to fill cells for visual layout
        if (colIndex === 7 || colIndex === 15) return 'A'; // Grades/A&G columns
        if (colIndex === 8 || colIndex === 16) return '88'; // Term Totals
        return '';
    };

    // --- Graph Data (to match the graph in the image) ---
    // The graph structure needs to be simplified to just one bar per assessment period for layout purposes.
    const graphData = [
        { label: 'FA1', value: '45', valueColor: '#d3d3d3' },
        { label: 'FA2', value: '55', valueColor: '#d3d3d3' },
        { label: 'SA1', value: '75', valueColor: '#d3d3d3' },
        { label: 'Term I Total', value: '60', valueColor: '#7fb3d5' },
        { label: 'FA3', value: '65', valueColor: '#d3d3d3' },
        { label: 'FA4', value: '70', valueColor: '#d3d3d3' },
        { label: 'SA2', value: '85', valueColor: '#d3d3d3' },
        { label: 'Term II Total', value: '75', valueColor: '#7fb3d5' },
        { label: 'Grand Total', value: '80', valueColor: '#ff9999' },
    ];
    const maxGraphValue = 100;
    const graphBarHeightScale = (value) => (value / maxGraphValue) * 80; // Scale to 80px max height

    // --- Component Structure ---
    return (
        <div style={{ width: '100vw', overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '10px', boxSizing: 'border-box' }}>
            <div style={{ transform: 'scale(1.0)', transformOrigin: 'top left', width: '8.5in', height: '11in' }}>
                <div style={baseStyles.page}>

                    {/* 1. Header Section */}
                    <div style={{ border: `1px solid ${COLOR_BORDER}`, padding: '5px', marginBottom: '5px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: 'black', fontWeight: 'bold', textAlign: 'center' }}>Affiliation No: **B720183**</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '5px' }}>
                            <img src={schoolLogo} alt="ABC School Logo" style={{ width: '50px', height: '50px' }} />
                            <div style={{ lineHeight: '1.2' }}>
                                <h1 style={baseStyles.schoolName}>
                                    <span style={{ color: COLOR_TEXT }}>ABC SCHOOL</span>
                                    <span style={{ color: COLOR_SUB_TEXT }}> - Miyapur, Hyderabad</span>
                                </h1>
                                <p style={{ margin: '0', fontSize: '9px', color: 'black', fontWeight:'bold' }}>
                                    (A CBSE Affiliated Senior Secondary Co-Education English Medium School)
                                </p>
                            </div>
                            <img src={schoolLogo} alt="CBSE Logo" style={{ width: '30px', height: '30px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${COLOR_SUB_TEXT}`, paddingTop: '3px', marginTop: '3px' }}>
                            <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>Region: Hyderabad</p>
                            <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>School Code: 32563</p>
                        </div>
                    </div>

                    {/* Report Card Title */}
               <p style={{ 
    textAlign: 'center', 
    fontSize: '14px', 
    fontWeight: 'bold', 
    padding: '3px 0', 
    margin: '5px 0' ,
    color:'rgb(128, 149, 160)'
}}>
    REPORT CARD
</p>

                  {/* Class and Issued by */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
    {/* Class aligned left */}
    <p style={{ margin: 0, color:'rgb(128, 149, 160)' , fontWeight:'bold' }}>Class: X</p>

    {/* Issued by centered */}
    <p style={{ margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color:'rgb(128, 149, 160)' , fontWeight:'bold' }}>
        (Issued by School as per directives of Central Board of Secondary Education, Delhi)
    </p>
</div>
                    {/* Student Profile and Overall Grading (Side-by-Side) */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                        
                        {/* Student Profile (Left Column) */}
                        <div style={{ flex: 3, border: `1px solid ${COLOR_BORDER}`, padding: '5px' }}>
                            <p style={{ fontWeight: 'bold', margin: '0 0 3px 0', fontSize: '9px', borderBottom: '1px solid #000' }}>Student Profile</p>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                                {/* Details Grid */}
                                <div style={{ flex: 3, display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1.5fr', gap: '2px', fontSize: '7.5px' }}>
                                    {Object.entries(studentData).map(([key, value], index) => (
                                        <React.Fragment key={key}>
                                            <div style={{ textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap', gridColumn: key === 'address' ? '1 / 2' : 'auto' }}>
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Do Birth', 'D.O.Birth').replace('Cbse Reg No', 'CBSE REG. No.')}{key === 'address' ? '' : ':'}
                                            </div>
                                            <div style={{ fontWeight: 'normal', gridColumn: key === 'address' ? '2 / 5' : (index % 2 === 0 ? '2 / 3' : '4 / 5') }}>
                                                {key === 'address' ? ` : ${value}` : value}
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                                {/* Photo Container (Right of Student Details) */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: '60px', height: '80px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', textAlign: 'center' }}>
                                        

[Image of Student Photo]

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis & Overall Grading (Right Column) */}
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {/* Analysis */}
                            <div style={{ border: `1px solid ${COLOR_BORDER}`, padding: '3px', flex: 1 }}>
                                <p style={{ margin: '0 0 3px 0', fontWeight: 'bold', fontSize: '8px' }}>Analysis: (Automated)</p>
                                <ul style={{ margin: '0', paddingLeft: '10px', fontSize: '7px', listStyleType: 'disc' }}>
                                    <li>Based on the study on the performance & Marks obtained.</li>
                                    <li>AI Generated & helpful tips to improve performance.</li>
                                    <li>Guidance is given after a strategic study based on the marks obtained in subjects and the school syllabus.</li>
                                    <li>Click on the link **https://analysis.tanz.tech** or visit the Report Page in your "Parent login" on the mobile app for improvements.</li>
                                </ul>
                            </div>
                            
                            {/* Overall Grading */}
                            <div style={{ border: `1px solid ${COLOR_BORDER}`, padding: '3px', flex: 1 }}>
                                <p style={{ fontWeight: 'bold', textAlign: 'center', margin: '0 0 2px 0', fontSize: '9px', borderBottom: '1px solid #000' }}>Overall Grading</p>
                                <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #000', textAlign: 'center', fontSize: '7px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...baseStyles.th, backgroundColor: COLOR_HEADER_BG }}>Academic</th>
                                            <th style={{ ...baseStyles.th, backgroundColor: COLOR_HEADER_BG }}>Behaviour</th>
                                            <th style={{ ...baseStyles.th, backgroundColor: COLOR_HEADER_BG }}>Activities</th>
                                            <th style={{ ...baseStyles.th, backgroundColor: COLOR_HEADER_BG }}>Attendance</th>
                                            <th style={{ ...baseStyles.th, backgroundColor: COLOR_HEADER_BG }}>Overall Grade</th>
                                            <th style={{ ...baseStyles.th, backgroundColor: COLOR_HEADER_BG }}>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ height: '25px' }}>
                                            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}>{overallGradingData.academicGrade}</td>
                                            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}></td>
                                            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}></td>
                                            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}></td>
                                            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}></td>
                                            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', fontSize: '10px' }}>{overallGradingData.result}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div style={{ fontSize: '7px', textAlign: 'right', marginTop: '3px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Disclaimer:</span> Displayed grades are indicative and based on a limited set of performance data.
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr style={{ borderTop: `1px solid ${COLOR_BORDER}`, margin: '5px 0' }} />

                    {/* 2. Main Content: Scholastic and Co-Scholastic (Two Columns) */}
                    <p style={{ ...baseStyles.sectionTitle, textAlign: 'center', border: `1px solid ${COLOR_BORDER}`, padding: '3px' }}>Academic Report</p>

                    <div style={{ display: 'flex', gap: '5px' }}>

                        {/* Left Column: Scholastic Area (Approx 70% width) */}
                        <div style={{ flex: 3, border: `1px solid ${COLOR_BORDER}`, padding: '5px' }}>
                            <p style={{ ...baseStyles.sectionTitle, margin: '0 0 2px 0', borderBottom: '1px solid #000' }}>Part: Scholastic Area</p>
                            <table style={baseStyles.table}>
                                <thead>
                                    <tr>
                                        <th rowSpan="3" style={{ ...baseStyles.th, width: '10%' }}>Subject Details</th>
                                        <th colSpan="9" style={{ ...baseStyles.th, backgroundColor: 'rgb(145, 167, 175)' }}>Term I</th>
                                        <th colSpan="9" style={{ ...baseStyles.th, backgroundColor: 'rgb(145, 167, 175)' }}>Term II</th>
                                        <th rowSpan="3" style={{ ...baseStyles.th, width: '5%' }}>Overall %</th>
                                        <th rowSpan="3" style={{ ...baseStyles.th, width: '5%' }}>Overall Grade</th>
                                    </tr>
                                    <tr>
                                        {/* Term I Assessment Headers */}
                                        <th colSpan="2" style={baseStyles.th}>FA1 (10%)</th>
                                        <th colSpan="2" style={baseStyles.th}>FA2 (10%)</th>
                                        <th colSpan="2" style={baseStyles.th}>SA1 (30%)</th>
                                        <th colSpan="3" style={baseStyles.th}>Term I Total (50%)</th>
                                        {/* Term II Assessment Headers */}
                                        <th colSpan="2" style={baseStyles.th}>FA3 (10%)</th>
                                        <th colSpan="2" style={baseStyles.th}>FA4 (10%)</th>
                                        <th colSpan="2" style={baseStyles.th}>SA2 (30%)</th>
                                        <th colSpan="3" style={baseStyles.th}>Term II Total (50%)</th>
                                    </tr>
                                    <tr>
                                        {/* Assessment Marks/Grades Sub-Headers (18 columns total) */}
                                        {/* Term I */}
                                        <th style={baseStyles.th}>Mks</th><th style={baseStyles.th}>Gr</th>
                                        <th style={baseStyles.th}>Mks</th><th style={baseStyles.th}>Gr</th>
                                        <th style={baseStyles.th}>Mks</th><th style={baseStyles.th}>Gr</th>
                                        <th style={{ ...baseStyles.th, backgroundColor: '#c5d8e2' }}>FA1+FA2+SA1</th><th style={baseStyles.th}>A&G</th><th style={baseStyles.th}>Total</th>
                                        {/* Term II */}
                                        <th style={baseStyles.th}>Mks</th><th style={baseStyles.th}>Gr</th>
                                        <th style={baseStyles.th}>Mks</th><th style={baseStyles.th}>Gr</th>
                                        <th style={baseStyles.th}>Mks</th><th style={baseStyles.th}>Gr</th>
                                        <th style={{ ...baseStyles.th, backgroundColor: '#c5d8e2' }}>FA3+FA4+SA2</th><th style={baseStyles.th}>A&G</th><th style={baseStyles.th}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scholasticSubjects.map((subject, index) => (
                                        <tr key={index}>
                                            <td style={{ ...baseStyles.td, fontWeight: 'bold' }}>{subject}</td>
                                            {/* 18 columns for Term I and Term II sub-assessments */}
                                            {Array(18).fill(null).map((_, i) => (
                                                <td key={i} style={{ ...baseStyles.td, textAlign: 'center' }}>
                                                    {i === 1 || i === 3 || i === 5 || i === 7 || i === 10 || i === 12 || i === 14 || i === 16 ? 'A' : ''}
                                                    {i === 8 || i === 17 ? '88' : ''}
                                                    {i === 6 || i === 15 ? '45' : ''}
                                                </td>
                                            ))}
                                            {/* Overall Columns */}
                                            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}>{index % 3 === 0 ? '88' : '...'}</td>
                                            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}>{index % 3 === 0 ? 'A1' : '...'}</td>
                                        </tr>
                                    ))}
                                    {/* Term Totals Row (Modified to match image structure) */}
                                    <tr>
                                        <td style={{ ...baseStyles.td, fontWeight: 'bold', textAlign: 'right' }}>Term I Total</td>
                                        <td colSpan="9" style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}>88</td>
                                        <td colSpan="9" style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}>88</td>
                                        <td colSpan="2" style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold' }}>88.0</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                    
                            {/* Graphical Report */}
                            <div style={{ border: `1px solid ${COLOR_BORDER}`, padding: '3px', marginTop: '5px' }}>
                                <p style={{ ...baseStyles.sectionTitle, margin: '0 0 3px 0', fontSize: '9px', borderBottom: '1px solid #000' }}>Graphical Report (Academics)</p>
                             
                        <p style={{ fontSize: '9px', margin: '0', textAlign:'left' }}>1. Accurate as per the Performance & Marks obtained by the Student.</p>
                        <p style={{ fontSize: '9px', margin: '0', textAlign:'left' }}>2. No Automations or AI tools are used to generate this chat and no analytical or future progress process .</p>
<p style={{ fontSize: '9px', margin: '0', textAlign: 'left' }}>
  3. Click on the link{' '}
  <a 
    href="https://report.tanz.tech" 
    target="_blank" 
    rel="noopener noreferrer"
    style={{ color: 'blue', textDecoration: 'underline' }}
  >
    https://report.tanz.tech
  </a>{' '}
  for brief information on the academic report.
</p>
                                {/* Graph Area (Simplified) */}
                                <div style={{ border: '1px solid #000', height: '100px', marginTop: '5px', position: 'relative' }}>
                                    {/* Y-Axis */}
                                    <div style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: '20px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '6px', textAlign: 'right', paddingRight: '2px' }}>
                                        <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                                    </div>
                                    {/* Bars */}
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '0 5px 0 25px', position: 'relative' }}>
                                        {graphData.map((data, index) => (
                                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '15px' }}>
                                                <div style={{ width: '15px', height: `${graphBarHeightScale(data.value)}px`, backgroundColor: data.valueColor, borderRadius: '1px' }}></div>
                                                <div style={{ fontSize: '6px', textAlign: 'center', marginTop: '2px' }}>{data.label.replace(' Term', 'T').replace(' Grand', 'G')}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '7px', borderTop: '1px solid #000', padding: '2px 0' }}>
                                        Subjects: **9** Total: **...**
                                    </div>
                                </div>
                            </div>

                        </div> {/* End of Left Column: Scholastic Area */}

                        {/* Right Column: Co-Scholastic Area (Approx 30% width) */}
                        <div style={{ flex: 1, border: `1px solid ${COLOR_BORDER}`, padding: '5px' }}>
                            <p style={{ ...baseStyles.sectionTitle, margin: '0 0 2px 0', borderBottom: '1px solid #000' }}>Part: Co-Scholastic Area</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '7px' }}>
                                {/* Area Table */}
<table style={baseStyles.table}>
    <thead>
        <tr>
            <th rowSpan="2" style={{ ...baseStyles.th, width: '40%' }}>Subject Details</th>
            <th colSpan="4" style={baseStyles.th}>Grade</th>
        </tr>
        <tr>
            <th style={baseStyles.th}>Sub Skill 1</th>
            <th style={baseStyles.th}>Sub Skill 2</th>
            <th style={baseStyles.th}>Sub Skill 3</th>
            <th style={baseStyles.th}>Sub Skill 4</th>
        </tr>
    </thead>
    <tbody>
        {[
            { subject: 'English', grades: ['listening', 'speaking', 'Reading', 'Writing'] },
            { subject: 'Telugu', grades: ['listening', 'speaking', 'Reading', 'Writing'] },
            { subject: 'Hindi', grades: ['listening', 'speaking', 'Reading', 'Writing'] },
            { subject: 'Maths', grades: ['understanding', 'computations', 'word problem', 'logical thinking'] },
            { subject: 'Science', grades: ['observation', 'Experimentation', 'concept clarity', 'Appplication'] },
            { subject: 'Social', grades: ['map skills', 'Historical facts', 'civic Awareness ', 'Geography un'] },
        ].map((item, index) => (
            <tr key={index}>
                <td style={{ ...baseStyles.td, fontWeight: 'bold' }}>{item.subject}</td>
                <td style={{ ...baseStyles.td, textAlign: 'center' }}>{item.grades[0]}</td>
                <td style={{ ...baseStyles.td, textAlign: 'center' }}>{item.grades[1]}</td>
                <td style={{ ...baseStyles.td, textAlign: 'center' }}>{item.grades[2]}</td>
                <td style={{ ...baseStyles.td, textAlign: 'center' }}>{item.grades[3]}</td>
            </tr>
        ))}
    </tbody>
</table>


                        {/* Grading Scale */}
<p style={{ fontWeight: 'bold', margin: '5px 0 2px 0', fontSize: '8px' }}>Grading Scale (Scholastics)</p>
<table style={baseStyles.table}>
    <thead>
        <tr>
            <th style={{ ...baseStyles.th, backgroundColor: COLOR_SUB_TEXT, fontSize: '8px', fontWeight: 'normal', width: '50%' }}>Grade</th>
            <th style={{ ...baseStyles.th, backgroundColor: COLOR_SUB_TEXT, fontSize: '8px', fontWeight: 'normal', width: '50%' }}>Marks Range</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style={{ ...baseStyles.td,  textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>A1</td>
            <td style={{ ...baseStyles.td,  textAlign: 'center' }}>91-100</td>
        </tr>
        <tr>
            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>A2</td>
            <td style={{ ...baseStyles.td, textAlign: 'center' }}>81-90</td>
        </tr>
        <tr>
            <td style={{ ...baseStyles.td,  textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>B1</td>
            <td style={{ ...baseStyles.td,  textAlign: 'center' }}>71-80</td>
        </tr>
        <tr>
            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>B2</td>
            <td style={{ ...baseStyles.td,  textAlign: 'center' }}>61-70</td>
        </tr>
        <tr>
            <td style={{ ...baseStyles.td,  textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>C1</td>
            <td style={{ ...baseStyles.td,  textAlign: 'center' }}>51-60</td>
        </tr>
        <tr>
            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>C2</td>
            <td style={{ ...baseStyles.td,  textAlign: 'center' }}>41-50</td>
        </tr>
        <tr>
            <td style={{ ...baseStyles.td,  textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>D</td>
            <td style={{ ...baseStyles.td,  textAlign: 'center' }}>33-40</td>
        </tr>
        <tr>
            <td style={{ ...baseStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>E(Needs to Improvement)</td>
            <td style={{ ...baseStyles.td, textAlign: 'center' }}>32 & below</td>
        </tr>
    </tbody>
</table>

                                <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', borderBottom: '1px solid #000' }}>Remarks</p>
                                <ul style={{ margin: '0', paddingLeft: '10px', fontSize: '7px', listStyleType: 'disc' }}>
                                    <li>Needs improvement in Math and Science.</li>
                                    <li>Good performance in Languages.</li>
                                </ul>
                            </div>
                        </div> {/* End of Right Column: Co-Scholastic Area */}
                    </div>

                    {/* Footer/Signature Area */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '8px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 20px 0', borderBottom: '1px dashed #000', paddingBottom: '3px' }}>Class Teacher's Signature</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 20px 0', borderBottom: '1px dashed #000', paddingBottom: '3px' }}>Principal's Signature</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 20px 0', borderBottom: '1px dashed #000', paddingBottom: '3px' }}>Date of Issue: 14/10/2025</p>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '7px' }}>
                        <p style={{ margin: '0', fontStyle: 'italic' }}>
                            The marks obtained in subject-wise scale and the publications syllabus will be followed.
                        </p>
                        <p style={{ margin: '0', fontStyle: 'italic' }}>
                            Click on the link **"https://students.abc.track"** or visit the Report Page in your Parent's App mobile app for improvements.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReportCardPortrait;