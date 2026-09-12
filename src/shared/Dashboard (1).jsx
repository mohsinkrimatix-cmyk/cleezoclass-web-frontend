import React, { useState,useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell } from 'recharts';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement
} from 'chart.js';import { Link } from 'react-router-dom';
import axios from 'axios';

import { Line, Bar, Radar, PolarArea } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement
);

const styles = {
  container: {
    padding: '1rem',
    fontFamily: 'Poppins, sans-serif',
    backgroundColor: '#f8f8fb',
    color: '#1f1f1f',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '2rem',
  },
  welcome: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  cards: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  card: {
    flex: '1 1 200px',
    minWidth: '200px',
    padding: '1rem',
    borderRadius: '10px',
    color: 'black',
    fontSize: '1rem',
    fontWeight: '600',
  },
  purple: { backgroundColor: 'rgba(106,184,164,255)' },
  navy: { backgroundColor: 'rgba(143,172,183,255)' },
 orange : { backgroundColor: 'rgba(14,150,135,255)' },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '1rem',
    marginBottom: '2rem',
  },
  tableSection: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  tableBox: {
    flex: '2 1 300px',
    minWidth: '300px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '1rem',
    minHeight:'270px'
  },
    tableBox1: {
    flex: '2 1 300px',
    minWidth: '300px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '1rem',
  },
  sidebarBox: {
    flex: '1 1 200px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '1rem',
  },
  appAd: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f3e8ff',
    borderRadius: '10px',
    textAlign: 'center',
  },
  img: {
    width: '100%',
    borderRadius: '10px',
  },
  dashboardContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  dashboardColumn: {
    flex: '1 1 500px',
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  dashboardHeader: {
    backgroundColor: '#fff',
    padding: '1rem',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '1.5rem',
    textAlign: 'center',
  },
  responsiveFlexContainer: {
    display: 'flex',
    width: '100%',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  tabContainer: {
    flex: '1 1 200px',
    minWidth: '200px',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  chartWrapper: {
    flex: '2 1 300px',
    minWidth: '250px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8px',
    padding: '1rem',
  },
  marketingDashboard: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  marketingTabs: {
    flex: '1 1 250px',
    minWidth: '250px',
    padding: '10px',
    backgroundColor: '#f5f6fa',
    borderRadius: '10px',
    fontFamily: 'Arial, sans-serif',
  },
  pieChartContainer: {
    flex: '1 1 250px',
    minWidth: '250px',
    padding: '10px',
    borderRadius: '10px',
    fontFamily: 'Arial, sans-serif',
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  quickActionButton: {
    padding: '0.75rem',
    borderRadius: '8px',
    color: 'white',
    border: 'none',
  },
  table: {
    width: '100%',
  },
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '16px',
  },
  serviceButton: {
    background: 'linear-gradient(135deg, #6ab8a4 0%, #5a9a8a 100%)',
    borderRadius: '14px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 6px 15px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    userSelect: 'none',
    fontWeight: 600,
    color: '#1a1a1a',
    fontSize: '1.1rem',
    width: '100%',
    border: 'none',
  },
  crmGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '16px',
  },
  crmButton: {
    backgroundColor: 'rgba(106,184,164,1)',
    borderRadius: '14px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 6px 15px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1.1rem',
    color: '#000',
    border: 'none',
    userSelect: 'none',
    width: '100%',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  marketingTabItem: {
    flex: '1 1 40%',
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(106,184,164,255)',
    color: '#2d3436',
    fontWeight: 'bold',
    fontSize: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  }
};

const polarData = {
  labels: ['Attendance', 'Performance', 'Academic', 'Timetable', 'Group'],
  datasets: [{
    data: [70, 85, 65, 90, 75],
    backgroundColor: [
      'rgba(106,184,164,255)',
      'rgba(14,150,135,255)',
      'rgba(143,172,183,255)',
      'rgba(16,125,104,255)',
      'rgba(179,192,198,255)'
    ],
    borderWidth: 1,
  }]
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
    background: isHovered ? "rgba(15,150,128,255)" : "rgba(81,170,156,255)",
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
  ? "0 12px 24px rgba(81,170,156,0.5)" // Thicker shadow when hovered
  : "0 6px 18px rgba(81,170,156,0.3)" // Thicker shadow when not hovered
,
    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
  });
 const headerStyle = {
    display: 'flex',
    backgroundColor: '#f0f4fa',
    fontWeight: 'bold',
    padding: '12px',
  };

  const rowStyle = {
    display: 'flex',
    borderTop: '1px solid #e0e0e0',
    alignItems: 'center',
    padding: '12px',
  };

  const cellStyle = {
    flex: 1,
    padding: '0 8px',
  };

  const buttonStyle = {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const imgStyle = {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
  };

  const rows = [
    {
      name: 'Jaydin Gross',
      score: 88,
      phone: '123-456-7890',
      email: 'jaydin@gmail.com',
      img: 'https://i.pravatar.cc/30?img=1',
    },
    {
      name: 'Michal Lupu',
      score: 92,
      phone: '987-654-3210',
      email: 'lupu@mail.com',
      img: 'https://i.pravatar.cc/30?img=2',
    },
    {
      name: 'Leo M',
      score: 75,
      phone: '456-789-1230',
      email: 'mike@mail.com',
      img: 'https://i.pravatar.cc/30?img=3',
    },
    {
      name: 'Danit Nevo',
      score: 95,
      phone: '321-654-9870',
      email: 'danit@mail.com',
      img: 'https://i.pravatar.cc/30?img=4',
    },
  ];
  const checkIconStyle = {
    color: "#ffffff",
  };
 
const profitLossChartData = {
  labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  datasets: [
    {
      label: 'Income (Rs.)',
      data: [3000, 5000, 7000, 6000, 8000, 11000, 10000, 9000, 7000, 9000, 8000, 15000],
      borderColor: 'rgba(13, 126, 101, 1)',
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: canvas } = chart;
        const gradient = canvas.createLinearGradient(0, 0, 0, chart.height);
        gradient.addColorStop(0, 'rgba(32, 220, 164, 0.4)');
        gradient.addColorStop(1, 'rgba(30, 201, 144, 0)');
        return gradient;
      },
      pointBackgroundColor: 'rgba(13, 126, 101, 1)',
      tension: 0.4,
      fill: true,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context) {
          const value = context.parsed.y;
          const label = value < 0 ? 'Loss: ' : 'Profit: ';
          return label + '$' + Math.abs(value).toLocaleString();
        }
      }
    },
  },
  scales: {
    x: {
      title: { display: true, text: 'Month' },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Amount (Rs)' },
      ticks: {
        callback: function(value) {
          return 'Rs.' + Math.abs(value);
        },
      },
      grid: {
        color: '#e5e7eb',
      },
    },
  },
};

const linkStyle = {
  margin: "0 10px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center"
};

const iconStyle = {
  padding: "10px",
  borderRadius: "50%",
  fontSize: "25px",
  transition: "all 0.3s",
  width: "40px",
  height: "40px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};
  const userRole = localStorage.getItem('userRole');

const metricsData = {
  labels: ['Attendance', 'Performance', 'Academic', 'Timetable', 'Group'],
  datasets: [
    {
      label: 'Performance Metrics',
      data: [70, 85, 65, 90, 75],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(251, 188, 4, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(244, 63, 94, 0.8)'
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(251, 188, 4, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(244, 63, 94, 1)'
      ],
      borderWidth: 1,
    }
  ]
};
const attendanceData = [
  { name: 'Present', value: 70 },
  { name: 'Absent', value: 20 },
  { name: 'On Leave', value: 10 }
];

const salaryData = [
  { name: 'Paid', value: 60 },
  { name: 'Pending', value: 30 },
  { name: 'Processing', value: 10 }
];

const recruitmentData = [
  { name: 'Interviewed', value: 60 },
  { name: 'Selected', value: 20 },
  { name: 'Rejected', value: 40 }
];
const COLORS = ['rgba(16,125,104,255)', 'rgba(106,184,164,255)','rgba(143,172,183,255)', ];
const metricsOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `${context.label}: ${context.raw}%`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: function(value) {
          return value + '%';
        }
      }
    }
  }
};

export default function Sidebarteacher2 () {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ADD THE LINE BELOW
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const dashboardRef = useRef(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
 const [loadingIds, setLoadingIds] = React.useState([]); // array of student_names currently loading

 const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');

useEffect(() => {
  const fetchSchoolLogo = async () => {
    console.log('🚀 Starting logo fetch process...');

    const code = localStorage.getItem('schoolCode');
    console.log('🧾 localStorage.getItem("schoolCode") =', code, '| Type:', typeof code);

    if (!code) {
      console.warn('❌ No school code found in localStorage. Aborting fetch.');
      return;
    }

    setDynamicSchoolCode(code);
    console.log('📦 Set dynamic school code in state:', code);

    try {
      console.log('📡 Sending POST request to backend with secretecode...');
      const response = await axios.post(
        'https://cleezoclass.com:4000/api/schoollogodynamic',
        { secretecode: code },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📬 Response from backend:', response);
      console.log('📬 Response.data:', response.data);

      if (response.data.logoPath) {
        console.log('✅ Logo fetched successfully from backend.');
        setDynamicLogoSrc(response.data.logoPath);
      } else {
        console.warn('⚠️ No logo path found in backend response.');
      }
    } catch (error) {
      console.error('🔥 Error fetching school logo:', error.response?.data || error.message);
    }
  };

  fetchSchoolLogo();
}, []);

const [hotLeads, sethotLeads] = useState([]);
const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
 
  // State to store the dynamically loaded page content
  const [activeContent, setActiveContent] = useState(null);
  const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [task, setTask] = useState("");
  const [warmLeads, setWarmLeads] = useState([]);
    // useEffect(() => {
    //   const fetchData = async () => {
    //     // const data = await fetchScoreFromAPI();
    //     setStudents(data);
    //   };
    //   fetchData();
    // }, []);

   const handleBackClick = () => {
    navigate('/'); // Navigate to the "accdemic" route
  };



  const generatePDFBlob = async () => {
    const element = dashboardRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };const classifyStudents = (students) => {
  if (Array.isArray(students)) {
    const studentsWithPercentage = students.map(student => ({
      ...student,
      percentage: (student.score / 190) * 100
    }));

    const hot = studentsWithPercentage.filter(student => student.percentage >= 80);
    const warm = studentsWithPercentage.filter(student => student.percentage >= 50 && student.percentage < 80);
    const cold = studentsWithPercentage.filter(student => student.percentage < 50);

    // ✅ Console log only for warm
    if (warm.length > 0) {
      console.log(`Warm leads count: ${warm.length}`);
    } else {
      console.log("No warm data");
    }

    return { hot, warm, cold };
  } else {
    console.error("Expected students to be an array but got:", students);
    return { hot: [], warm: [], cold: [] };
  }
};


const { warm } = classifyStudents(students);
 
   
 
    const handleAssign = () => {
      if (selectedStudent) {
        console.log(`Assigned "${task}" to ${selectedStudent.student_name}`);
        alert(`✅ Task assigned to ${selectedStudent.student_name}: ${task}`);
        setTask("");
        setSelectedStudent(null);
      }
    };
 
  const sendAdsTowarmLeads = async () => {
  setSending(true);
  setMessageStatus(null);

  try {
    const response = await fetch("https://cleezoclass.com:4000/api/warmlead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // No body or payload sent
    });

    const data = await response.json();

    if (response.ok) {
      setMessageStatus("Ads sent successfully to Warm Leads!");
    } else {
      setMessageStatus(`Error sending ads: ${data.error || "Unknown error"}`);
    }
  } catch (error) {
    setMessageStatus(`Failed to send ads: ${error.message}`);
  } finally {
    setSending(false);
  }
};


const handleDownload = async () => {
  const input = dashboardRef.current;
  if (!input) return;

  // Step 1: Expand the element to full height temporarily
  const originalStyle = {
    height: input.style.height,
    overflow: input.style.overflow,
  };

  const fullHeight = input.scrollHeight;

  input.style.height = fullHeight + 'px';
  input.style.overflow = 'visible';

  // Allow time for rendering the expanded content
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Step 2: Take full screenshot
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      width: input.scrollWidth,
      height: input.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = 210; // A4
    const pageHeight = 297;
    const imgProps = pdf.getImageProperties(imgData);

    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('Leads dashboard.pdf');
  } catch (error) {
    console.error('Error generating full PDF:', error);
  } finally {
    // Step 3: Restore original styles
    input.style.height = originalStyle.height;
    input.style.overflow = originalStyle.overflow;
  }
};const sendAdToStudent = async (student) => {
  setLoadingIds(prev => [...prev, student.student_name]); // add loading state

  try {
    const response = await fetch("https://cleezoclass.com:4000/api/sendAdToStudent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(student)
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ Sent to ${student.student_name}`);
      console.log(data);
    } else {
      alert(`❌ Failed: ${data.error}`);
    }
  } catch (error) {
    console.error("Error sending:", error);
    alert("❌ Error while sending message");
  } finally {
    setLoadingIds(prev => prev.filter(id => id !== student.student_name)); // remove loading state
  }
};
 const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };
 

  // Share PDF if supported
  const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], 'Leadspage.pdf', { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Management Report',
          text: 'Please find the Management report attached.',
          files: [file],
        });
        console.log('PDF shared successfully!');
      } catch (err) {
        alert('Sharing was cancelled or failed: ' + err.message);
      }
    } else {
      alert('This device or browser does not support file sharing. Please download and share manually.');
    }
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
const renderDonutChart = (title, data) => (
  <div style={{
    flex: '1',
    minWidth: '160px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }}>
    <h4 style={{ 
      margin: '0 0 8px 0', 
      fontSize: '13px',
      fontWeight: '600',
      color: '#333'
    }}>{title}</h4>
    
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PieChart width={140} height={140} style={{ margin: '0 auto' }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={55}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          minAngle={10}
          isAnimationActive={false} // Disable animations
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]}
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
        </Pie>
      </PieChart>

      <div style={{ 
        marginTop: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {data.map((entry, index) => (
          <div key={`legend-${index}`} style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            lineHeight: '1.3'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              backgroundColor: COLORS[index % COLORS.length],
              marginRight: '4px',
              borderRadius: '2px'
            }}/>
            <span>{entry.name}: {entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
   const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();





  return (
    <div>
   <header style={{
  backgroundColor: '#fff',
  color: 'white',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  position: 'fixed',
  width: '100%',
  top: '0',
  zIndex: '50',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: '12px solid black' // Add this line
}}>
  {/* Responsive styles via style tag */}
  <style>
    {`
      @media (max-width: 768px) {
        .header-logo {
          height: 50px !important;
          left: 1rem !important;
        }
        .header-title {
          font-size: 1rem !important;
          padding: 0 0.5rem !important;
        }
        .header-wrapper {
          padding: 0.5rem !important;
        }
      }

      @media (max-width: 480px) {
        .header-logo {
          height: 40px !important;
          left: 0.5rem !important;
        }
        .header-title {
          font-size: 0.9rem !important;
        }
      }
    `}
  </style>

  {/* Logo */}
  <img
    src={dynamicLogoSrc || "/default-logo.png"}
    alt="School Logo"
    className="header-logo"
    style={{
      height: '80px',
      width: 'auto',
      borderRadius: '1px',
      position: 'absolute',
      left: '3rem',
      top: '50%',
      transform: 'translateY(-50%)',
      paddingLeft: '1rem'
    }}
  />

  {/* Flex Wrapper */}
  <div
    className="header-wrapper"
    style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0.75rem 1rem',
      display: 'flex',
      justifyContent: 'center',
      position: 'relative'
    }}
  >
    <h1
      className="header-title"
      style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        margin: 0,
        whiteSpace: 'nowrap',
        color: 'black'
      }}
    >
      {dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL
    </h1>
  </div>
</header>




 <div className="outer-container" style={{ paddingTop: '80px' }}>
  {/* ADD THE BUTTON DIV BELOW */}
  <div className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
    <i className="fa fa-bars" style={{ fontSize: '24px', color: '#000' }}></i>
  </div>


  <aside className={`sidebar ${isMenuOpen ? 'sidebar-mobile-open' : ''}`}>

        {/* ADD THE DIV FOR THE CLOSE BUTTON BELOW */}
    <div className="mobile-menu-close" onClick={() => setIsMenuOpen(false)}>
        <i className="fa fa-times" style={{ fontSize: '24px' }}></i>
    </div>

<nav className="nav-icons">
  {/* Operations */}
  {['superadmin','director','management', 'teacher', 'Admin'].includes(userRole) ? (
    <Link to="/homepage3" style={linkStyle}>
      <i className="fa fa-graduation-cap" title="Operations" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-graduation-cap" title="Operations (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Admissions */}
  {['superadmin','director', 'Admin','management', 'Admission Counsellor'].includes(userRole) ? (
    <Link to="/marketing" style={linkStyle}>
      <i className="fa fa-id-card" title="Admissions" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-id-card" title="Admissions (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Commerce */}
  {['superadmin','director','management', 'accountant'].includes(userRole) ? (
    <Link to="/AccountantDashboard" style={linkStyle}>
      <i className="fa fa-calculator" title="Commerce" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-calculator" title="Commerce (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* HR/Recruitment */}
  {['superadmin', 'Admin', 'hr'].includes(userRole) ? (
    <Link to="/RecruitmentDashboard" style={linkStyle}>
      <i className="fa fa-user-plus" title="HR/Recruitment" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-user-plus" title="HR/Recruitment (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Services - Visible to all but access controlled by route */}
  <Link to="/services" style={linkStyle}>
    <i className="fa fa-tasks" title="School Services" style={iconStyle}></i>
  </Link>

  {/* Support - Visible to all but access controlled by route */}
  <Link to="/SupportTeamCategories" style={linkStyle}>
    <i className="fa fa-users" title="Support" style={iconStyle}></i>
  </Link>

  {/* Settings - Visible to all but access controlled by route */}
  <Link to="/settings" style={linkStyle}>
    <i className="fa fa-cog" title="Settings" style={iconStyle}></i>
  </Link>

  {/* Nova Web App - Always enabled and visible to all */}
  <a
    href="https://cleezoclass.com//"
    target="_blank"
    rel="noopener noreferrer"
    style={linkStyle}
  >
    <i className="fa fa-globe" title="Nova Web App" style={iconStyle}></i>
  </a>
</nav>
              </aside>



 <div className="main-content">
           
    <div style={styles.container}>
      {/* Responsive styles using media queries */}
       <style>
        {`
          /* --- Sidebar & Mobile Toggle REMOVED --- */
          .sidebar, .mobile-menu-toggle, .mobile-menu-close {
            display: none !important;
          }

          /* --- Main Content Layout --- */
          .main-content {
            width: 100%; /* Ensure it takes full width */
            padding-left: 0; /* Remove any potential sidebar spacing */
          }
          
          /* --- Main Layout --- */
          @media (max-width: 768px) {
            .outer-container {
              flex-direction: column;
            }
          }
          
          /* --- Header --- */
          @media (max-width: 768px) {
            .header {
              height: 80px !important;
            }
            .header-logo {
              height: 45px !important;
              left: 1rem !important;
              padding-left: 0 !important;
            }
            .header-title {
              font-size: 1rem !important;
              padding: 0 0.5rem !important;
              text-align: center;
            }
          }

          /* --- Dashboard & Content Stacking --- */
          @media (max-width: 1024px) {
            .dashboardContainer {
              flex-direction: column;
              gap: 1.5rem;
            }
            .dashboard-column {
              width: 100%;
              gap: 1rem;
            }
            .dashboard-column > div[style*="background-color"] {
              height: auto !important;
              min-height: unset !important;
            }
            .marketing-dashboard {
              flex-direction: column;
              gap: 1rem;
            }
            .marketing-tabs, .marketing-graph-container {
              min-width: 100%;
              max-width: 100% !important;
            }
          }
          
          @media (max-width: 768px) {
            .container {
              padding: 0.5rem;
            }
            .responsive-flex-container {
              flex-direction: column;
              align-items: center;
              gap: 1rem;
            }
            .dashboard-column .chart-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1.5rem;
              width: 100%;
              padding: 0 !important;
            }
          }
          
          @media (max-width: 480px) {
            .dashboard-header {
              font-size: 1.1rem;
              padding: 0.75rem;
            }
            .marketing-tab-item {
              flex-basis: 100%;
            }
            .hr-tabs-container {
              margin-left: 0 !important;
              justify-content: center;
              gap: 10px !important;
            }
          }
        `}
      </style>


      <div style={styles.dashboardContainer}>
        {/* Commerce Dashboard Column */}
        <div className="dashboard-column" style={styles.dashboardColumn}>
          <div className="dashboard-header" style={styles.dashboardHeader}>Commerce Dashboard</div>
         
         <div
  style={{ ...styles.tableBox1, marginBottom: 0 }}
  onClick={() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'superadmin' ||'director'||'management'|| userRole === 'accountant') {
      navigate('/AccountantDashboard');
    } else {
      // Handle unauthorized access
      alert('You do not have permission to access this page');
      // Or redirect to a different page
      // navigate('/unauthorized');
    }
  }}
>
            <div style={styles.cards}>
             
              <div className="card" style={{ ...styles.card, ...styles.purple }}>
                INCOME 
              </div>
              <div className="card" style={{ ...styles.card, ...styles.navy }}>
                EXPENSES 
              </div>
               <div className="card" style={{ ...styles.card, ...styles.orange }}>
                PROFIT OR LOSS 
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#111827', display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                Annual Profit & Loss
                {/* <span style={{ color: 'rgba(14,150,135,255)' }}>$39,345 Net Profit</span> */}
              </h3>
             
              <div style={{ height: '300px' }}>
                <Line data={profitLossChartData} options={chartOptions} />
              </div>
            </div>
          </div>

{/* <div style={{ 
  height: '300px', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '10px', 
  overflow: 'auto' 
}}>
  <div style={{ 
    flex: 1, 
    display: 'flex', 
    gap: '20px', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    padding: '10px 0' 
  }}>
    {renderDonutChart('Attendance', attendanceData)}
    {renderDonutChart('Salaries', salaryData)}
    {renderDonutChart('Recruiters', recruitmentData)}
  </div>

  <div style={{ 
    ...styles.tableBox, 
    width: '100%', 
    marginBottom: 0 
  }}>
    <div style={styles.dashboardHeader}>HR Dashboard</div>
    <div style={{ ...styles.tableBox, marginBottom: 0 }}>
      {[
        { icon: '', label: 'Attendance', bg: 'rgba(106,184,164,255)' },
        { icon: '', label: 'Leave', bg: 'rgba(179,192,198,255)' },
        { icon: '', label: 'Payroll', bg: 'rgba(143,172,183,255)' },
        { icon: '', label: 'Recruiters', bg: 'rgba(16,125,104,255)' },
        { icon: '', label: 'Salaries', bg: 'rgba(14,150,135,255)' }
      ].map((btn, index) => (
        <button 
          key={index} 
          style={{
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '10px',
            padding: '0.75rem 1rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: btn.bg,
            color: '#000',
            fontWeight: 'bold',
            marginBottom: '10px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/services')}
        >
          <i className={btn.icon}></i> {btn.label}
        </button>
      ))}
    </div>
  </div>
</div> */}

               <div className="dashboard-header" style={styles.dashboardHeader}>HR Dashboard</div>

       <div
  style={{ ...styles.tableBox, marginBottom: 0 }}
  onClick={() => {
    const userRole = localStorage.getItem('userRole');
    const allowedRoles = ['superadmin','director','management', 'Admin', 'HR']; // Original casing
   
    // Case-insensitive comparison
    const hasAccess = allowedRoles.some(role =>
      role.toLowerCase() === userRole?.toLowerCase()
    );
   
    if (hasAccess) {
      navigate('/RecruitmentDashboard');
    } else {
      alert('You do not have permission to access this page');
    }
  }}
>
         <div className="responsive-flex-container" style={{
  display: 'flex',
  flexDirection: 'column', // Changed to column to put tabs at bottom
  // height: '100%', // Maintain full height
  gap: '20px'
}}>
  {/* Centered Radar Chart Container - Now at top */}
  <div className="chart-wrapper" style={{
    flex: 1,
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: '10px 0'
  }}>
    {renderDonutChart('Attendance', attendanceData)}
    {renderDonutChart('Salaries', salaryData)}
    {renderDonutChart('Recruiters', recruitmentData)}
  </div>

  {/* Tabs Container - Moved to bottom */}
<div className="hr-tabs-container" style={{
  display: 'flex',
  flexWrap: 'wrap', // Allows items to wrap to next line if needed
  gap: '12px', // Space between items
  alignItems: 'center',
  marginTop:'-25px',
  marginLeft:'45px'
}}>
  {[
    { label: 'Attendance ', bg: 'rgba(106,184,164,255)' },
    { label: ' Performance', bg: 'rgba(179,192,198,255)' },
    { label: 'salary', bg: 'rgba(14,150,135,255)' },
    { label: 'payroll', bg: 'rgba(143,172,183,255)' },
    { label: 'recruiters', bg: 'rgba(16,125,104,255)' }
  ].map((btn, index) => (
    <div key={index} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      backgroundColor: btn.bg,
      color: '#000',
      fontWeight: 'bold',
    }}>
      <span style={{
        color: 'white',
        fontSize: '1.2rem'
      }}></span>
      {btn.label}
    </div>
  ))}
</div>
</div>
          </div>

        </div>

        {/* Operation Dashboard Column */}
        <div className="dashboard-column" style={styles.dashboardColumn}>
          <div className="dashboard-header" style={styles.dashboardHeader}>Operation Dashboard</div>
         
       <div
  style={{ ...styles.tableBox, marginBottom: 0 }}
  onClick={() => {
    const userRole = localStorage.getItem('userRole');
    const allowedRoles = ['superadmin','director','management', 'Admin', 'Teacher']; // Original casing
   
    // Case-insensitive comparison
    const hasAccess = allowedRoles.some(role =>
      role.toLowerCase() === userRole?.toLowerCase()
    );
   
    if (hasAccess) {
      navigate('/homepage3');
    } else {
      alert('You do not have permission to access this page');
    }
  }}
>
            <div className="responsive-flex-container" style={styles.responsiveFlexContainer}>
              {/* Left Container - Tabs */}
              <div style={styles.tabContainer}>
                {[
                  {  label: 'Attendance Management', bg: 'rgba(106,184,164,255)' },
                  {  label: 'Staff Performance', bg: 'rgba(179,192,198,255)' },
                  {  label: 'Reports', bg: 'rgba(14,150,135,255)' },
                  {  label: 'Timetable Autogeneration', bg: 'rgba(143,172,183,255)' },
                  {  label: 'Group Chart', bg: 'rgba(16,125,104,255)' }
                ].map((btn, index) => (
                  <button key={index} style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '10px',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: btn.bg,
                    color: '#000',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    cursor: 'pointer',
                  }}>
                    <span>{btn.icon}</span> {btn.label}
                  </button>
                ))}
              </div>

              {/* Centered Radar Chart Container */}
              <div className="chart-wrapper" style={styles.chartWrapper}>
                <div style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: '300px',
                  margin: '0 auto',
                }}>
                  <PolarArea
                    data={polarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          suggestedMin: 0,
                          suggestedMax: 100,
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
         
          <div className="dashboard-header" style={styles.dashboardHeader}>Marketing Dashboard</div>
  <div
  style={{ ...styles.tableBox, marginBottom: 0 }} // Added fixed height here
  onClick={() => {
    const userRole = localStorage.getItem('userRole'); // Get role from storage
    const allowedRoles = ['superadmin', 'admin','director','management', 'admission counsellor']; // All lowercase

    if (userRole && allowedRoles.includes(userRole.toLowerCase())) {
      navigate('/marketing');
    } else {
      alert('You do not have permission to access this page');
    }
  }}
>
            <div className="marketing-dashboard" style={styles.marketingDashboard}>
              {/* LEFT: 5 Tabs */}
              <div className="marketing-tabs" style={styles.marketingTabs}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {[
                    { label: 'Admission Form', color: 'rgba(106,184,164,255)' },
                    { label: 'Entrance Test', color: 'rgba(179,192,198,255)' },
                    { label: 'Follow-up', color: 'rgba(143,172,183,255)' },
                    { label: 'Counseling', color: 'rgba(14,150,135,255)' },
                    { label: 'Leads', color: 'rgba(16,125,104,255)' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="marketing-tab-item"
                      style={{
                        ...styles.marketingTabItem,
                        backgroundColor: item.color
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                        e.currentTarget.style.transform = 'scale(1.03)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Animated Graph */}
<div className="marketing-graph-container" style={{
  flex: 0.6,
  padding: '15px',
  backgroundColor: '#f0f2f5',
  borderRadius: '16px',
  fontFamily: 'Arial, sans-serif',
  maxWidth: '320px',
  boxSizing: 'border-box',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
}}>
  <h4 style={{
    marginBottom: '12px',
    color: '#2d3436',
    fontSize: '20px',
    textAlign: 'center'
  }}>
  </h4>

  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '260px',
    width: '100%',
    position: 'relative',
  }}>
    <div className="marketing-pie" style={{
      width: '220px',
      height: '220px',
      position: 'relative',
      borderRadius: '50%',
      background: `conic-gradient(
        rgb(179,192,198,255) 0% 14.3%,      
        rgba(14,150,135,255) 14.3% 46.6%,
        rgb(143,172,183,255) 46.6% 81.9%,
        rgb(16,125,104,255) 81.9% 100%
      )`,
      margin: '0 auto',
      boxShadow: '0 0 12px rgba(0,0,0,0.15)',
      transformOrigin: '50% 50%',
      animation: 'rotatePie 2.5s ease-out forwards',
    }}>

      {/* Donut Hole */}
      <div className="marketing-pie-hole" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '120px',
        height: '120px',
        background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: `
          inset 4px 4px 8px rgba(255, 255, 255, 0.8),
          inset -4px -4px 8px rgba(0, 0, 0, 0.1)
        `,
        border: '1.5px solid #d1d9e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '16px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#2c3e50',
        textAlign: 'center',
        padding: '10px',
        lineHeight: '1.3',
        userSelect: 'none',
        cursor: 'default',
      }}>
        Admission Rate
      </div>

      {/* Animated Popup Labels */}
      {/* Each label positioned inside its color slice */}
      {[
        { top: '12%', left: '50%', color: '#4B9CD3', icon: '🎉', text: 'Open Admission' },
        { top: '35%', left: '87%', color: '#A0D468', icon: '✅', text: '≥75% Accepted' },
        { top: '72%', left: '85%', color: '#666666', icon: '⚠️', text: '50–75% Accepted' },
        { top: '90%', left: '22%', color: '#F39C12', icon: '❌', text: '≤50% Accepted' },
      ].map((label, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: label.top,
            left: label.left,
            transform: 'translate(-50%, -50%)',
            fontSize: '18px',
            color: label.color,
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '8px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            opacity: 0,
            pointerEvents: 'none',
            userSelect: 'none',
            animationName: 'popupFade',
            animationDuration: '6s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            animationDelay: `${i * 1.5}s`,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{fontSize: '20px'}}>{label.icon}</span> {label.text}
        </div>
      ))}

      {/* Animation keyframes */}
      <style>
        {`
          @keyframes rotatePie {
            0% { transform: rotate(0deg) scale(0.9); opacity: 0.8; }
            100% { transform: rotate(360deg) scale(1); opacity: 1; }
          }
          @keyframes popupFade {
            0%, 20% { opacity: 1; }
            33.33%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  </div>
</div>
            </div>
          </div>
        </div>
      </div>
    </div></div></div></div>
  );
}

