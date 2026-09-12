import React, { useState } from 'react';

// 🚀 CRITICAL UPDATE: IMPORT THE FULL COMPONENTS FROM THEIR FILES
import AdmissionStudentChief from '../chief/Chief_operations_AdmissionStudent'; 
import AdmissionTeacherChief from '../chief/Chief_operations_AdmissionTeacher'; 


// =======================================================
// MAIN WRAPPER COMPONENT (AdmissionTab.jsx)
// =======================================================
export default function AccademicAdminDashboard() {
    // State to track the active tab: 'student' or 'teacher'
    const [activeTab, setActiveTab] = useState('student'); 

    // --- INLINE STYLES (No CSS change) ---
    const wrapperStyle = {
        background: "#fff", minHeight: "50vh", padding: "0px", boxSizing: "border-box",
       width: "100%",
    };

    const tabContainerStyle = {
        display: 'flex',
        borderBottom: '2px solid #ddd',
        marginBottom: '0',
        padding: '0px',
    };

    const tabButtonStyle = {
        padding: '10px 20px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: 'transparent',
        transition: 'color 0.3s',
        outline: 'none',
    };

    const activeTabStyle = {
        color: '#3498db', 
        borderBottom: '3px solid #3498db',
    };

    const inactiveTabStyle = {
        color: '#777',
        borderBottom: '3px solid transparent',
    };
    // -------------------------------------

    const renderContent = () => {
        // This logic correctly calls the imported components based on the state
        if (activeTab === 'student') {
            return <AdmissionStudentChief/>;
        } else if (activeTab === 'teacher') {
            return <AdmissionTeacherChief />;
        }
        return null;
    };

    return (
        <div style={wrapperStyle}>
            {/* Tab Navigation */}
       
     <div style={tabContainerStyle}>
                <button
                    onClick={() => setActiveTab('student')}
                    style={{
                        ...tabButtonStyle,
                        ...(activeTab === 'student' ? activeTabStyle : inactiveTabStyle)
                    }}
                >
                    Student Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('teacher')}
                    style={{
                        ...tabButtonStyle,
                        ...(activeTab === 'teacher' ? activeTabStyle : inactiveTabStyle)
                    }}
                >
                    Teacher/Staff Dashboard
                </button>
            </div>
            {/* Conditionally Rendered Content */}
            <div style={{ padding: '10px' }}>
                {renderContent()}
            </div>
        </div>
    );
}