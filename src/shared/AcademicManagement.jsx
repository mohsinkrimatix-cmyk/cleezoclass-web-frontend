import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AcademicManagement.css';
import { useNavigate } from 'react-router-dom';
import React, { useState,useRef,useContext ,useEffect} from 'react';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
const schoolLogo = ""; // Optional custom logo
const AcademicManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [academicStats, setAcademicStats] = useState({
    performance: 85,
    weeklyChange: 5,
  });
  const logoSrc = schoolLogo || "/default-logo.png";
  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // State to store the dynamically loaded page content
  
  
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

  const navigate = useNavigate();
  // Mock data for charts
  const [activePage, setActivePage] = useState(null);
  
  // State to store the dynamically loaded page content
  const [activeContent, setActiveContent] = useState(null);
  
  const handleCardsyllabusClick = () => {
    navigate('/syllabus', { state: { from: 'main' } });  // Keep track of where they came from
  };
  
  const handleCardevaluvationClick = () => {
    navigate('/evaluvations', { state: { from: 'main' } });  // Keep track of where they came from
  };
  
  const handleCardpapergenerationClick = () => {
    navigate('/questionpaper', { state: { from: 'main' } });
  };
  
  const handleCardeTopClick = () => {
    navigate('/Applications', { state: { from: 'main' } });  // Keep track of where they came from
  };
  
  const handleCardweakClick = () => {
    navigate('/weakstudents', { state: { from: 'main' } });
  };
  
  const attendanceData = [
    { name: 'Jan', attendancePercentage: 92, assignmentsCompleted: 8 },
    { name: 'Feb', attendancePercentage: 89, assignmentsCompleted: 10 },
    { name: 'Mar', attendancePercentage: 94, assignmentsCompleted: 7 },
  ];
  const [activeSection, setActiveSection] = useState('dashboard'); // default to dashboard

  const drivingBehaviorData = [
    { name: 'Speeding', value: 45 },
    { name: 'Harsh Braking', value: 35 },
    { name: 'Idle Time', value: 55 },
  ];

  const staffPerformanceData = {
    soh: 92,
    issuesDetected: 15,
    lastMonths: 3,
    changePercentage: 3.45,
  };

  useEffect(() => {
    // Simulate loading data - in a real app, you would fetch data here
    console.log("Academic Management Page loaded");
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    // In a real application, you would fetch new data based on the selected date
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
   
    <div className="operations-dashboard-container-asc">

      
     

      <div className="dashboard-grid-asc">
        {/* Attendance Management Panel */}
        <div className="dashboard-panel-asc"  onClick={handleCardsyllabusClick}>
          <h2 className="panel-title-asc">Syllabus</h2>
          <div className="attendance-card-asc">
            <div className="attendance-icon-asc"></div>
            <div className="attendance-details-asc">
              <div className="attendance-id-asc">EV3434</div>
              <div className="attendance-name-asc">TATA Nexon</div>
              <div className="attendance-subtext-asc">Nexon Smart OPT</div>
              <div className="attendance-date-asc">Updated on Jan 1, 2024</div>
            </div>
          </div>
        </div>

        {/* Staff Performance Panel */}
        <div className="dashboard-panel-asc" onClick={handleCardpapergenerationClick}>
          <h2 className="panel-title-asc">Paper Generation</h2>
          <div className="performance-stats-asc">
            <div className="issues-detected-asc">
              <div className="issues-number-asc">{staffPerformanceData.issuesDetected}</div>
              <div className="issues-label-asc">issues detected</div>
            </div>
            <div className="time-period-asc">
              Last {staffPerformanceData.lastMonths} Months
              <span className={`change-indicator-asc ${staffPerformanceData.changePercentage > 0 ? 'positive-asc' : 'negative-asc'}`}>
                {staffPerformanceData.changePercentage > 0 ? '+' : ''}{staffPerformanceData.changePercentage}%
              </span>
            </div>
          </div>
          <div className="performance-chart-container-asc">
            <div className="donut-chart-asc">
              <div className="donut-percentage-asc">
                <div className="percentage-value-asc">{staffPerformanceData.soh}%</div>
                <div className="percentage-label-asc">SOH</div>
              </div>
            </div>
            <div className="performance-legend-asc">
              <div className="legend-item-asc">
                <span className="legend-marker-good-asc"></span>
                <span className="legend-text-asc">Good</span>
              </div>
              <div className="legend-item-asc">
                <span className="legend-marker-average-asc"></span>
                <span className="legend-text-asc">Average</span>
              </div>
              <div className="legend-item-asc">
                <span className="legend-marker-defect-asc"></span>
                <span className="legend-text-asc">Defect</span>
              </div>
            </div>
          </div>
        </div>


        {/* Staff Performance Panel */}
        <div className="dashboard-panel-asc" onClick={ handleCardevaluvationClick}>
          <h2 className="panel-title-asc">Evalution</h2>
          <div className="performance-stats-asc">
            <div className="issues-detected-asc">
              <div className="issues-number-asc">{staffPerformanceData.issuesDetected}</div>
              <div className="issues-label-asc">issues detected</div>
            </div>
            <div className="time-period-asc">
              Last {staffPerformanceData.lastMonths} Months
              <span className={`change-indicator-asc ${staffPerformanceData.changePercentage > 0 ? 'positive-asc' : 'negative-asc'}`}>
                {staffPerformanceData.changePercentage > 0 ? '+' : ''}{staffPerformanceData.changePercentage}%
              </span>
            </div>
          </div>
          <div className="performance-chart-container-asc">
            <div className="donut-chart-asc">
              <div className="donut-percentage-asc">
                <div className="percentage-value-asc">{staffPerformanceData.soh}%</div>
                <div className="percentage-label-asc">SOH</div>
              </div>
            </div>
            <div className="performance-legend-asc">
              <div className="legend-item-asc">
                <span className="legend-marker-good-asc"></span>
                <span className="legend-text-asc">Good</span>
              </div>
              <div className="legend-item-asc">
                <span className="legend-marker-average-asc"></span>
                <span className="legend-text-asc">Average</span>
              </div>
              <div className="legend-item-asc">
                <span className="legend-marker-defect-asc"></span>
                <span className="legend-text-asc">Defect</span>
              </div>
            </div>
          </div>
        </div>





        {/* Staff Performance Panel */}
        <div className="dashboard-panel-asc"onClick={handleCardeTopClick}>
          <h2 className="panel-title-asc">Toper Evalutions</h2>
          <div className="performance-stats-asc">
            <div className="issues-detected-asc">
              <div className="issues-number-asc">{staffPerformanceData.issuesDetected}</div>
              <div className="issues-label-asc">issues detected</div>
            </div>
            <div className="time-period-asc">
              Last {staffPerformanceData.lastMonths} Months
              <span className={`change-indicator-asc ${staffPerformanceData.changePercentage > 0 ? 'positive-asc' : 'negative-asc'}`}>
                {staffPerformanceData.changePercentage > 0 ? '+' : ''}{staffPerformanceData.changePercentage}%
              </span>
            </div>
          </div>
          <div className="performance-chart-container-asc">
            <div className="donut-chart-asc">
              <div className="donut-percentage-asc">
                <div className="percentage-value-asc">{staffPerformanceData.soh}%</div>
                <div className="percentage-label-asc">SOH</div>
              </div>
            </div>
            <div className="performance-legend-asc">
              <div className="legend-item-asc">
                <span className="legend-marker-good-asc"></span>
                <span className="legend-text-asc">Good</span>
              </div>
              <div className="legend-item-asc">
                <span className="legend-marker-average-asc"></span>
                <span className="legend-text-asc">Average</span>
              </div>
              <div className="legend-item-asc">
                <span className="legend-marker-defect-asc"></span>
                <span className="legend-text-asc">Defect</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Management Panel */}
        <div className="dashboard-panel-asc"onClick={handleCardweakClick}>
          <h2 className="panel-title-asc">Weak Students</h2>
          <div className="academic-stats-asc">
            <div className="performance-percentage-asc">
              <div className="percentage-value-asc">{academicStats.performance}%</div>
            </div>
            <div className="time-period-asc">
              Last Week
              <span className={`change-indicator-asc ${academicStats.weeklyChange > 0 ? 'positive-asc' : 'negative-asc'}`}>
                {academicStats.weeklyChange > 0 ? '+' : ''}{academicStats.weeklyChange}%
              </span>
            </div>
          </div>
          <div className="chart-container-asc">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={attendanceData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="assignmentsCompleted" name="Assignments Completed" fill="#82ca9d" />
                <Bar dataKey="attendancePercentage" name="Attendance (%)" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="driving-behavior-chart-asc">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart
                layout="vertical"
                data={drivingBehaviorData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 40,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#3498db" />
              </BarChart>
            </ResponsiveContainer>
            <div className="behavior-legend-asc">
              <div className="behavior-item-asc">Speeding</div>
              <div className="behavior-item-asc">Harsh Braking</div>
              <div className="behavior-item-asc">Idle Time</div>
            </div>
          </div>
        </div>
      </div>
      {activeSection === 'syllabus' && (
      <div>
        <h2>Syllabus Page</h2>
        {/* Your Syllabus Component or content */}
        <button onClick={() => setActiveSection('dashboard')}>Back to Dashboard</button>
      </div>
    )}

    {activeSection === 'paperGeneration' && (
      <div>
        <h2>Paper Generation Page</h2>
        {/* Your Paper Generation content */}
        <button onClick={() => setActiveSection('dashboard')}>Back to Dashboard</button>
      </div>
    )}
    </div>
    </div></div></>
  );
};

export default AcademicManagement;

// 