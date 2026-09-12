import React from 'react';
import schoolLogo from './download.png';

const ReportCardFull = () => {
    // Colors
    const COLOR_NAVY = '#000080';
    const COLOR_LIGHT_BLUE = '#ADD8E6';
    const COLOR_PEACH = '#FFE4B5';
    const COLOR_LIGHT_GREEN = '#90EE90';
    const COLOR_LIGHT_GRAY = '#D3D3D3';
    const COLOR_KHAKI = '#F0E68C';
    const COLOR_GOLD = '#FFD700';
    const COLOR_RED = '#FF6347';
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
    // Base Styles (unchanged)
    const baseStyles = {
        page: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            margin: '0 auto',
            padding: '20px',
            border: '2px solid #325490',
            width: '12.69in',
            height: '10.27in',
            boxSizing: 'border-box',
            backgroundColor: '#fff',
            overflow: 'hidden',
        },
        schoolName: {
            fontSize: '40px',
            fontWeight: 'bold',
            color: 'rgb(62, 80, 99)',
            margin: '0',
        },
        reportCardTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: COLOR_LIGHT_BLUE,
            padding: '3px 0',
            margin: '5px 0',
            textAlign: 'center',
        },
        academicTitle: {
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '5px',
            border: '2px solid #325490',
            marginBottom: '5px',
            color: 'rgb(128, 149, 160)',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '10px',
        },
        th: {
            border: '1px solid #000',
            padding: '3px',
            textAlign: 'left',
            backgroundColor: COLOR_LIGHT_GRAY,
            fontWeight: 'normal',
        },
        td: {
            border: '1px solid #000',
            padding: '3px',
            textAlign: 'left',
        },
    };

    // Additional Styles (unchanged)
    const styles = {
        ...baseStyles,
        overallTableTh: {
            ...baseStyles.th,
            backgroundColor: COLOR_LIGHT_BLUE,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        overallTableTd: {
            ...baseStyles.td,
            textAlign: 'center',
            fontWeight: 'bold',
        },
        subjectHeaderCell: {
            ...baseStyles.th,
            backgroundColor: 'rgb(145, 167, 175)',
            textAlign: 'center',
            fontSize: '8px',
            fontWeight: 'bold',
        },
        termHeader: {
            ...baseStyles.th,
            backgroundColor: 'rgb(145, 167, 175)',
            textAlign: 'center',
            fontWeight: 'bold',
        },
        gradeScaleTd: (color) => ({
            ...baseStyles.td,
            backgroundColor: 'rgb(128, 149, 160)',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '9px',
        }),
        graphsSideBySideContainer: {
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            margin: '10px 0',
        },
        graphContainer: {
            height: '120px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            padding: '5px 5px 0 30px',
            position: 'relative',
            width: '45%',
        },
        yAxis: {
            position: 'absolute',
            left: '0',
            top: '0',
            bottom: '0',
            width: '25px',
            borderRight: '1px solid #000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '7px',
            textAlign: 'right',
            paddingRight: '2px',
        },
        barWrapper: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0 10px',
            width: '30px',
        },
        bar: (height, color) => ({
            width: '30px',
            height: `${height}px`,
            backgroundColor: color,
            marginBottom: '5px',
            borderRadius: '2px',
        }),
        barLabel: {
            fontSize: '10px',
            textAlign: 'center',
            marginTop: '5px',
        },
    };

    const graphData = [
        { label: 'FA1', value: 51, percent: 7, valueColor: '#d3d3d3', percentColor: '#ff6b6b' },
        { label: 'FA2', value: 74, percent: 10, valueColor: '#d3d3d3', percentColor: '#ff6b6b' },
        { label: 'SA1', value: 68, percent: 9, valueColor: '#d3d3d3', percentColor: '#ff6b6b' },
        { label: 'Term', value: 57, percent: 8, valueColor: '#d3d3d3', percentColor: '#ff6b6b' },
        { label: 'FA3', value: 59, percent: 8, valueColor: '#d3d3d3', percentColor: '#ff6b6b' },
        { label: 'FA4', value: 63, percent: 9, valueColor: '#d3d3d3', percentColor: '#ff6b6b' },
        { label: 'SA2', value: 86, percent: 12, valueColor: '#d3d3d3', percentColor: '#ff6b6b' },
        { label: 'Term', value: 55, percent: 8, valueColor: '#d3d3d3', percentColor: '#ff6b6b' },
        { label: 'Total', value: 62, percent: 100, valueColor: '#7fb3d5', percentColor: '#7fb3d5' },
    ];
   // Subjects in the Scholastic Area table
    const scholasticSubjects = [
        'English - I', 'English - II', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'General Knowledge', 'Moral Science'
    ];    const maxGraphValue = 100;

    const graphBarHeightScale = (value) => (value / maxGraphValue) * 80; // Scale to 80px max height

    return (
        <div
            style={{
                width: '100vw',
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                padding: '10px',
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    transform: 'scale(0.8)',
                    transformOrigin: 'top left',
                    width: '11.69in',
                    height: '9.27in',
                }}
            >
                <div style={styles.page}>
                    {/* Header Section */}
                    <div style={{ border: '2px solid #325490', padding: '5px', marginBottom: '10px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: 'black', fontWeight: 'bold' }}>Affiliation No: **B720183**</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px', borderBottom: '2px solid rgb(128, 149, 160)' }}>
                            <img src={schoolLogo} alt="ABC School Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'white' }} />
                            <div style={{ lineHeight: '1.2' }}>
                                <h1 style={styles.schoolName}>
                                    <span style={{ color: 'rgb(62, 80, 99)' }}>ABC SCHOOL</span>{' '}
                                    <span style={{ color: 'rgb(128, 149, 160)' }}> - Miyapur, Hyderabad</span>
                                </h1>
                                <p style={{ margin: '0', fontSize: '12px', color: 'black', fontWeight: 'bold' }}>
                                    (A CBSE Affiliated Senior Secondary Co-Education English Medium School)
                                </p>
                            </div>
                            <img src={schoolLogo} alt="CBSE Logo" style={{ width: '40px', height: '40px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '8px' }}>
                            <p style={{ margin: '0', fontSize: '12px', color: 'black', fontWeight: 'bold' }}>Region: Hyderabad</p>
                            <p style={{ margin: '0', fontSize: '12px', color: 'black', fontWeight: 'bold' }}>School Code: 32563</p>
                        </div>
                    </div>
                    {/* Report Card Title */}
                    <p style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', padding: '3px 0', margin: '5px 0', color: 'rgb(128, 149, 160)' }}>
                        REPORT CARD
                    </p>
                    {/* Class and Issued by */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <p style={{ margin: 0, color: 'rgb(128, 149, 160)' }}>Class: X</p>
                        <p style={{ margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: 'rgb(128, 149, 160)' }}>
                            (Issued by School as per directives of Central Board of Secondary Education, Delhi)
                        </p>
                    </div>
                    {/* Student Profile and Overall Grading */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', border: '2px solid #325490', padding: '5px', marginRight: '10px' }}>
                            {/* Student Profile Info */}
                            <div style={{ flex: 3, fontSize: '9px' }}>
                                <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', textAlign: 'left', color: 'rgb(128, 149, 160)' }}>Student Profile</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 2fr', gap: '3px' }}>
                                    <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold' }}>Name</div>
                                    <div style={{ color: 'black', fontWeight: 'bold' }}> : Santhosh Reddy</div>
                                    <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold' }}>Roll No.</div>
                                    <div style={{ color: 'black', fontWeight: 'bold' }}> : 32</div>
                                    <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold' }}>Class & Section</div>
                                    <div style={{ color: 'black', fontWeight: 'bold' }}> : X-B</div>
                                    <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold' }}>Admission No.</div>
                                    <div style={{ color: 'black', fontWeight: 'bold' }}> : 625/2013</div>
                                    <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold' }}>D.O.Birth</div>
                                    <div style={{ color: 'black', fontWeight: 'bold' }}> : 01 March 2013</div>
                                    <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold' }}>CBSE REG. No.</div>
                                    <div style={{ color: 'black', fontWeight: 'bold' }}> : **...</div>
                                    <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold' }}>Father's Name</div>
                                    <div style={{ color: 'black', fontWeight: 'bold' }}> : J. Amarender Reddy</div>
                                    <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold' }}>Contact No.</div>
                                    <div style={{ color: 'black', fontWeight: 'bold' }}> : 9800540748</div>
                                    <div style={{ textAlign: 'left', gridColumn: '1 / 2', color: 'black', fontWeight: 'bold' }}>Residential Address</div>
                                    <div style={{ gridColumn: '2 / 5', color: 'black', fontWeight: 'bold' }}> : Flat No. 402, Divya Apt., Pragathi Colony, Miyapur, Hyderabad-500090</div>
                                </div>
                            </div>
                            {/* Photo Box */}
                            <div style={{ flex: 1, marginLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '80px', height: '100px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                    No Photo
                                </div>
                            </div>
                        </div>
                        {/* Overall Grading */}
                        <div style={{ display: 'flex', border: '2px solid #325490', padding: '5px', marginRight: '10px' }}>
                            <div style={{ flex: 1.5, marginRight: '10px' }}>
                                <p style={{ fontWeight: 'bold', textAlign: 'left', margin: '0 0 5px 0', padding: '5px', color: 'rgb(128, 149, 160)' }}>Overall Grading</p>
                                <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #000', textAlign: 'center' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '5px' }}></th>
                                            <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '5px' }}>Academical</th>
                                            <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '5px' }}>Behaviour</th>
                                            <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '5px' }}>Activities</th>
                                            <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '5px' }}>Attendance</th>
                                            <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '5px' }}>Overall Grade</th>
                                            <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '5px' }}>Result (Pass / EIOP<sup>*</sup>)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}>Obtained Marks</td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', verticalAlign: 'middle' }} rowSpan="3">PASS</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}>Percentage</td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}>Grades</td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                            <td style={{ border: '1px solid #000', padding: '5px' }}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <hr style={{ borderTop: '1px solid #325490', margin: '10px 0' }} />
                    {/* Academic Report */}
                    <p style={styles.academicTitle}>Academic Report</p>
                    {/* Scholastic Area and Graphical Report */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>




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
                            
                 
                            
                       <p style={{ fontWeight: 'bold', margin: '5px 0 2px 0' }}>Grading Scale (Scholastic Area)</p>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {['Grade', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E*'].map((grade, index) => (
                                    <th key={index} style={{ ...styles.th, backgroundColor:'rgb(128, 149, 160)', textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>{grade}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={styles.gradeScaleTd(COLOR_LIGHT_GRAY)}>Marks Range</td>
                                <td style={styles.gradeScaleTd(COLOR_LIGHT_GREEN)}>91-100</td>
                                <td style={styles.gradeScaleTd(COLOR_LIGHT_GREEN)}>81-90</td>
                                <td style={styles.gradeScaleTd(COLOR_LIGHT_BLUE)}>71-80</td>
                                <td style={styles.gradeScaleTd(COLOR_LIGHT_BLUE)}>61-70</td>
                                <td style={styles.gradeScaleTd(COLOR_KHAKI)}>51-60</td>
                                <td style={styles.gradeScaleTd(COLOR_KHAKI)}>41-50</td>
                                <td style={styles.gradeScaleTd(COLOR_GOLD)}>33-40</td>
                                <td style={styles.gradeScaleTd(COLOR_RED)}>32 & below</td>
                            </tr>
                        </tbody>
                    </table>

                        </div> {/* End of Left Column: Scholastic Area */}



                        {/* Graphical Report */}
                        <div style={{ flex: 2 }}>
                            <div style={{ border: '1px solid #000', padding: '5px' }}>
                                <p style={{ textAlign: 'left', color: 'rgb(128, 149, 160)', fontWeight: 'bold', fontSize: '12px' }}>Graphical Report</p>
                                <p style={{ fontSize: '9px', margin: '0', textAlign: 'left' }}>1. Accurate as per the Performance & Marks obtained by the Student.</p>
                                <p style={{ fontSize: '9px', margin: '0', textAlign: 'left' }}>2. No Automations or AI tools are used to generate this chat and no analytical or future progress process.</p>
                                <p style={{ fontSize: '9px', margin: '0', textAlign: 'left' }}>
                                    3. Click on the link{' '}
                                    <a href="https://report.tanz.tech" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>
                                        https://report.tanz.tech
                                    </a>{' '}
                                    for brief information on the academic report.
                                </p>
                                <div style={{ border: '1px solid #000', height: '180px', marginTop: '10px' }}>
                                    <div style={styles.graphContainer}>
                                        <div style={styles.yAxis}>
                                            <div>100</div>
                                            <div>90</div>
                                            <div>70</div>
                                            <div>50</div>
                                            <div>20</div>
                                            <div>0</div>
                                        </div>
                                        {graphData.map((data, index) => (
                                            <div key={index} style={styles.barWrapper}>
                                                <div style={styles.bar(data.percent, data.percentColor)}></div>
                                                <div style={styles.bar(data.value, data.valueColor)}></div>
                                                <div style={styles.barLabel}>{data.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '7px', paddingTop: '5px', borderTop: '1px solid #000', margin: '0 5px' }}>
                                        Subjects: **7** Total: **62**
                                    </div>
                                </div>
                            </div>
                            <div style={{ border: '1px solid #000', padding: '5px', marginTop: '10px', fontSize: '9px', textAlign: 'justify' }}>
                                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Analysis:(Automated)</p>
                                <p style={{ margin: '0' }}>1. Basing on the study on the performance and marks obtained</p>
                                <p style={{ margin: '0' }}>2. AI Generated & a helpful tip to improve performance</p>
                                <p style={{ margin: '0' }}>3. Guidance is given after a strategic study basing on the marks obtained in subjects wise scale and the publications syllabus recorded with the school</p>
                                <p style={{ margin: '0', fontSize: '9px', textAlign: 'left' }}>
                                    4. Click on the{' '}
                                    <a href="https://analysis.tanz.tech" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>
                                        https://analysis.tanz.tech
                                    </a>{' '}
                                    or visit Report page in your "parent login" on mobile app for the improvements.
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Footer/Notes */}
                    <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '8px' }}>
                        <p style={{ margin: '0' }}>The marks obtained in subject wise scale and the publications syllabus will be followed.</p>
                        <p style={{ margin: '0' }}>
                            Click on the link **"https://students.abc.track"** or visit Report Page in your Parent'sApp mobile app for the improvements.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCardFull;
