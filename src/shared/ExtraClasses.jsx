import React, { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------------
// ⚠️ NOTE: In a real application, you would remove MOCK_STYLES and import 
// styles, or pass them as props, but they are included here for completeness
// as a single-page file.
// ---------------------------------------------------------------------------------
const MOCK_STYLES = {
    isMobile: window.innerWidth < 768, 
    circleColors: ['#000', '#000', '#000', '#000', '#B97FA5', '#7F9BB9'],
    smallCard: { 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        maxWidth: '500px', 
        margin: '20px auto', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    },
    sectionTitleStyle: { fontWeight: 'bold', marginBottom: '10px' },
    labelStyle: { fontWeight: '500', minWidth: '50px' },
    inputStyle: (width) => ({ 
        border: '1px solid #ccc', borderRadius: '4px', padding: '6px 8px', 
        width: width || '100%', boxSizing: 'border-box', 
        fontSize: (window.innerWidth < 768) ? "12px" : "14px"
    }),
    dropdownStyle: { 
        border: '1px solid #ccc', borderRadius: '4px', padding: '6px 8px', 
        flexGrow: 1, fontSize: (window.innerWidth < 768) ? "12px" : "14px"
    },
};


const ExtraSpecialClassCard = () => {
    
    const { isMobile, circleColors, smallCard, sectionTitleStyle, labelStyle, inputStyle, dropdownStyle } = MOCK_STYLES;

    // --- State for Forms ---
    const [extraClassForm, setExtraClassForm] = useState({
        class: '', date: '', time: '', duration: '', staff: '',
    });
    const [specialClassForm, setSpecialClassForm] = useState({
        class: '', date: '', time: '', duration: '', staff: '',
    });
    
    // --- State for Dynamic Dropdown Options ---
    const [classOptions, setClassOptions] = useState([]);
    const [staffOptions, setStaffOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ------------------------------------------------------------------
    // 1. Data Fetching (Populates Class and Staff Dropdowns)
    // ------------------------------------------------------------------
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Calls GET /api/metadata/class-staff-options
                const response = await fetch('https://cleezoclass.com:4000/api/metadata/class-staff-options'); 
                const data = await response.json();
                
                if (response.ok) {
                    setClassOptions(data.classOptions || []);
                    setStaffOptions(data.staffOptions || []);
                } else {
                    alert(`Failed to load options: ${data.message}`);
                }
            } catch (error) {
                console.error("Network Error:", error);
                alert("Failed to connect to the server to load class/staff data. Ensure backend is running.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOptions();
    }, []);

    // ------------------------------------------------------------------
    // 2. API Handler for Form Submission
    // ------------------------------------------------------------------
    const handleRequestSubmission = useCallback(async (payload) => {
        try {
            // Calls POST /api/request-class
            const response = await fetch('https://cleezoclass.com:4000/api/request-class', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
            } else {
                alert(`Request Failed: ${data.message}`);
            }
        } catch (error) {
            console.error("API call error:", error);
            alert("An unexpected error occurred during the class request submission.");
        }
    }, []);


    // --- Form UI Logic ---
    const localInnerGrid = {
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "10px" : "15px",
    };

    const requestButtonStyle = {
        backgroundColor: "#B97FA5", border: "none", borderRadius: "4px", color: "#fff", 
        padding: "4px 10px", fontSize: isMobile ? "10px" : "12px", fontWeight: "500", 
        cursor: "pointer", marginLeft: 'auto'
    };


    const handleFormChange = (formType, field, value) => {
        const setter = formType === 'extra' ? setExtraClassForm : setSpecialClassForm;
        setter(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e, formType) => {
        e.preventDefault();
        const formData = formType === 'extra' ? extraClassForm : specialClassForm;
        
        if (!formData.class || !formData.date || !formData.time || !formData.duration || !formData.staff) {
            alert("Please fill all fields before requesting.");
            return;
        }

        const durationInMinutes = parseInt(formData.duration, 10);
        if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
             alert("Duration must be a valid positive number.");
             return;
        }

        const payload = {
            request_type: formType.toUpperCase(),
            class_name: formData.class,
            date: formData.date,
            time: formData.time,
            duration_minutes: durationInMinutes,
            staff_name: formData.staff,
        };
        
        handleRequestSubmission(payload);
        
        // Reset form
        const resetter = formType === 'extra' ? setExtraClassForm : setSpecialClassForm;
        resetter({ class: '', date: '', time: '', duration: '', staff: '' });
    };

    const renderForm = (formType, formData) => (
        <form onSubmit={(e) => handleSubmit(e, formType)} style={localInnerGrid}>
            
            {/* Class Dropdown */}
            <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px"}}>
                <select 
                    style={dropdownStyle}
                    value={formData.class}
                    onChange={(e) => handleFormChange(formType, 'class', e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">SELECT CLASS</option>
                    {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
            </div>
            
            {/* Date and Time Inputs */}
            <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px"}}>
                <label style={labelStyle}>DATE</label>
                <input type="date" style={inputStyle("100px")} value={formData.date}
                    onChange={(e) => handleFormChange(formType, 'date', e.target.value)}
                />
                <label style={labelStyle}>TIME</label>
                <input type="time" style={inputStyle("80px")} value={formData.time}
                    onChange={(e) => handleFormChange(formType, 'time', e.target.value)}
                />
            </div>
            
            {/* Duration, Staff Dropdown, and Button */}
            <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px"}}>
                <label style={labelStyle}>DURATION (mins)</label>
                <input type="number" style={inputStyle("50px")} placeholder="Mins" value={formData.duration}
                    onChange={(e) => handleFormChange(formType, 'duration', e.target.value)}
                />
                <select style={dropdownStyle} value={formData.staff}
                    onChange={(e) => handleFormChange(formType, 'staff', e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">SELECT STAFF</option>
                    {staffOptions.map(staff => <option key={staff} value={staff}>{staff}</option>)}
                </select>
                <button type="submit" style={requestButtonStyle} disabled={isLoading}>
                    REQUEST
                </button>
            </div>
        </form>
    );

    if (isLoading) {
        return <div style={{textAlign: 'center', marginTop: '50px', ...smallCard}}>Loading class and staff data...</div>;
    }

    return (
        <div style={smallCard}>
            <div style={{fontWeight: "600", fontSize: isMobile ? "16px" : "20px", textAlign: "center", marginBottom: "20px", textDecoration: "underline"}}>EXTRA/SPECIAL CLASSES</div>
            
            <div style={sectionTitleStyle}><span style={{ color: circleColors[4] }}>●</span> **EXTRA CLASS**</div>
            {renderForm('extra', extraClassForm)}

            <div style={{...sectionTitleStyle, marginTop: '20px'}}><span style={{ color: circleColors[5] }}>●</span> **SPECIAL CLASSES**</div>
            {renderForm('special', specialClassForm)}
        </div>
    );
};

export default ExtraSpecialClassCard;