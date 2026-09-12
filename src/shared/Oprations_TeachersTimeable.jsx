// TeacherTimeTable.jsxx

import { CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState,useRef,useContext ,useEffect} from 'react';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
const schoolLogo = ""; // Optional custom logo

const Teacherstimetable = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const logoSrc = schoolLogo || "/default-logo.png";
  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // State to store the dynamically loaded page content
  const [activeContent, setActiveContent] = useState(null);
  
  
  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };
  

 
  const handleGroupChartClick = () => {
    setActivePage('groupchart');
    setActiveContent(true);
  };
  const handleteacherstimetableClick = () => {
    setActivePage('timetable');
    setActiveContent(true);
  };
  
  const handlestaffperformanceClick = () => {
    setActivePage('staffperform');
    setActiveContent(true);
  };
  const handlesaccedamicmanagemenClick = () => {
    setActivePage('accdemic');
    setActiveContent(true);
  };
  
  const openCalendar = () => {
    dateInputRef.current?.showPicker();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Check this out!',
      text: 'Here is something worth sharing.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } else {
        alert('Web Share API not supported in this browser.');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };
  // The container click handler to update active content
  const handleContainerClick = (content) => {
    setActiveContent(content); // Update active content
  };

  // Function to download content as PDF
  const handleDownload = () => {
    const content = headerRef.current;
    
    // Set the scale for the page, this is to ensure that the entire page fits
    const scale = 2;  // You can adjust this value to your needs

    // Capture the entire content as a canvas
    html2canvas(content, {
      scale: scale,
      useCORS: true, // Ensure that it can render external images properly
      logging: false // Disable logging for better performance
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png'); // Convert canvas to image
      const doc = new jsPDF('p', 'mm', 'a4'); // Create an A4 document

      // Adjust the width and height based on the canvas
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Scale height according to the width
      
      // Add the image to the PDF (top-left corner of the page)
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Save the PDF
      doc.save('dashboard.pdf');
    });
  };
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };
  const teacherTabs = {
    "Timetable Auto Generation": "/TimetableGeneration",
    "Teacher Availability": "/TeacherDetails",
    "Substitute Assign": "/demo2",
  };

  const containerStyle = {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "30px 20px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "16px",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    boxSizing: "border-box",
  };

  const titleSectionStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  };

  const titleStyle = {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    margin: 0,
  };

  const descriptionStyle = {
    fontSize: "18px",
    color: "#4b5563",
    marginBottom: "30px",
    lineHeight: "1.6",
    maxWidth: "800px",
  };

  const featuresTitleStyle = {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "20px",
  };

  const featuresGridStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
    width: "100%",
    maxWidth: "900px",
  };

  const featureButtonStyle = (isHovered) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 20px",
    background: isHovered ? "#4338ca" : "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    fontWeight: "500",
    cursor: "pointer",
    minWidth: "260px",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: isHovered
      ? "0 8px 18px rgba(79,70,229,0.3)"
      : "0 4px 12px rgba(0,0,0,0.05)",
    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
  });

  const checkIconStyle = {
    color: "#ffffff",
  };
  const handleBackClick = () => {
    navigate('/homepage3'); // Navigate to the "accdemic" route
  };
  return (
      <>
            <header className="top-bar">
              <div className="left-section">School Logo</div>
            </header>
        
            <div className="outer-container">
          
        
              <div className="main-content">
          
    <div style={containerStyle}>
      <div style={titleSectionStyle}>
        <Star size={30} color="#4f46e5" />
        <h1 style={titleStyle}>Teacher Time Table</h1>
      </div>
      <p style={descriptionStyle}>
        Easily manage teacher schedules, view availability, and assign substitutes with smart tools.
      </p>

      <h2 style={featuresTitleStyle}>Key Features</h2>
      <div style={featuresGridStyle}>
        {Object.keys(teacherTabs).map((tab, index) => (
          <button
            key={index}
            style={featureButtonStyle(hoveredIndex === index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => navigate(teacherTabs[tab])}
          >
            <CheckCircle style={checkIconStyle} size={20} />
            {tab}
          </button>
        ))}
      </div>
    </div>
    </div></div></>
  );
};

export default Teacherstimetable;
