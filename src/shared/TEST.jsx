import axios from 'axios';
import jsPDF from 'jspdf';
import React, { useState, useRef, useEffect } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import TwoButtons from './SeatingArrangmentClasswise';
import ObjectionCertificate from './ObjectionCertificate1';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import '@fortawesome/fontawesome-free/css/all.min.css';
import {
    faBookReader, faExclamationCircle, faAward, faChartBar, faSync, faChartLine,
    faClock, faUsers, faTimes // faTimes is needed for the popup close button
} from "@fortawesome/free-solid-svg-icons";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
    const API_BASE = 'https://cleezoclass.com:4000/api/'; // Match your backend PORT

const ExamDashboard = () => {
  // --- State for Question Paper Generator ---
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [questionCounts, setQuestionCounts] = useState({
    'Short Answer': 0,
    'Long Answer': 0,
    'MCQ': 0,
  });
  const [questionPaper, setQuestionPaper] = useState([]);
  const [totalMarks, setTotalMarks] = useState(0);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [board, setBoard] = useState('SSC');
  const contentRef = useRef(null);
    // UNIFIED MONTH STATE 
 const [selectedMonth, setSelectedMonth] = useState("2025-08"); 

  // --- State for Scan & Pull ---
  const [selectedClassScan, setSelectedClassScan] = useState('');
  const [selectedSectionScan, setSelectedSectionScan] = useState('');
  const [unpaidStudents, setUnpaidStudents] = useState([]);
  const [pendingClasses, setPendingClasses] = useState([]);
  const [submittedClasses, setSubmittedClasses] = useState([]);
const [selectedDesignation, setSelectedDesignation] = useState("");
const [selectedClasses, setSelectedClasses] = useState([]);
const handleReportTeacher = () => {
    alert("Report Teacher clicked!");
};

const handleComplainAdmin = () => {
    alert("Complaint to Super Admin clicked!");
};

  // --- State for Invigilator ---
  const [selectedClassInvigilator, setSelectedClassInvigilator] = useState('');
  // ADDED: State for selected subject in Invigilator section
  const [selectedSubjectInvigilator, setSelectedSubjectInvigilator] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [message, setMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- State for dismissed classes ---
  const [dismissedClasses, setDismissedClasses] = useState(() => {
    const saved = localStorage.getItem('dismissedClasses');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Common State ---
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState('exam');
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  // --- Refs for height calculation ---
  const headerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const actionsHeaderRef = useRef(null);
  // REMOVED: const [actionsListHeight, setActionsListHeight] = useState(0); 
  
  // --- Effects ---
  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
      setError('School code not found. Please log in again.');
      return;
    }
    // Fetch classes and sections
    axios.get('https://cleezoclass.com:4000/api/class-sections', { params: { schoolCode } })
      .then(res => {
        setClasses(res.data.classes);
        setSections(res.data.sections);
      })
      .catch(err => {
        console.error('Error fetching classes and sections:', err);
        setError('Failed to load class/section data');
      });
    // Fetch teacher names
    axios.get('https://cleezoclass.com:4000/teachers', { params: { schoolCode } })
      .then(res => setTeachers(res.data))
      .catch(err => console.error('Error fetching teachers:', err));
    // Fetch school logo
    axios.post('https://cleezoclass.com:4000/api/schoollogodynamic', { secretecode: schoolCode })
      .then(res => {
        if (res.data.logoPath) setDynamicLogoSrc(res.data.logoPath);
      })
      .catch(err => console.error('Error fetching school logo:', err));
  }, []);
    const handleRefresh = () => {
        // Refetch all core data using the current filters
        fetchAcademicTotals(selectedMonth);
        fetchChartData();
        fetchMetadata(); // Refresh metadata as well
    };

  const getFilterParams = () => {
        const schoolCode = getSchoolCode();
        return `schoolCode=${schoolCode}&month=${selectedMonth}` +
               (selectedTeacher ? `&teacher=${selectedTeacher}` : '') +
               (selectedSubject ? `&subject=${selectedSubject}` : '') +
               (selectedClass ? `&class=${selectedClass}` : '');
    };

    // =======================================================
    // useEffect HOOKS
    // =======================================================
    const [allTeachersMetadata, setAllTeachersMetadata] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false); 

    // 1. Initial Data Fetch
    useEffect(() => {
        fetchAcademicTotals(selectedMonth);
        fetchChartData();
        fetchMetadata(); 
    }, []);
    // --- Totals Fetch ---
    const fetchAcademicTotals = async (monthYear) => {
        setAcademicTotals(prev => ({ ...prev, loading: true, error: null }));
        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setAcademicTotals(prev => ({ ...prev, loading: false, error: "School Code not found" }));
            return;
        }

        try {
            // Updated to use ALL filters
            const params = getFilterParams(); 
            const response = await axios.get(`${API_BASE}/dashboard-totals?${params}`);
            const data = response.data;

            setAcademicTotals({
                // Dashboard Card
                monthlyAvgScore: parseFloat(data.monthlyAvgScore) || 0,
                totalTests: parseFloat(data.totalTests) || 0,
                // Critical Alerts
                poorPerformers: parseFloat(data.poorPerformers) || 0,
                highPerformers: parseFloat(data.highPerformers) || 0,
                unpunctualStudents: parseFloat(data.unpunctualStudents) || 0,
                // Breakdown Boxes
                progressReportsGenerated: parseFloat(data.progressReportsGenerated) || 0,
                attendanceTracked: parseFloat(data.attendanceTracked) || 0,
                splCount: parseFloat(data.splCount) || 0, 
                loading: false,
                error: null
            });
        } catch (err) {
            console.error("Error fetching Academic Totals:", err);
            setAcademicTotals(prev => ({
                ...prev,
                loading: false,
                error: err.message.includes('Network') ? 'Network Error' : 'API Error'
            }));
        }
    };
  // --- Fetch Chart Data ---
    const fetchChartData = async () => {
        setChartLoading(true);
        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setChartLoading(false);
            console.error("School Code not found for chart data.");
            return;
        }

        const params = getFilterParams();

        try {
            // 1. Bar Chart Data (Performance by Test Type)
            const barChartResponse = await axios.get(`${API_BASE}/test-performance-by-type?${params}`);
            setTestPerformanceData(barChartResponse.data || []);

            // 2. Line Chart Data (Monthly Performance Trend)
            const trendResponse = await axios.get(`${API_BASE}/monthly-performance-trend?${params}`);
            setPerformanceTrendData(trendResponse.data || []);

        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setChartLoading(false);
        }
    };
// Constant for mapping the 'teaches_to' columns to derive unique subjects
const TEACHES_TO_COLUMNS = [
    'teaches_to_1', 'teaches_to_2', 'teaches_to_3', 'teaches_to_4',
    'teaches_to_5', 'teaches_to_6', 'teaches_to_7', 'teaches_to_8',
    'teaches_to_9', 'teaches_to_10', 'teaches_to_11', 'teaches_to_12'
];

    // 2. Fetch Totals & Charts when filters change (month, teacher, subject, class)
    useEffect(() => {
        // Trigger refetch whenever any of the primary filters change
        fetchAcademicTotals(selectedMonth);
        fetchChartData();
    }, [selectedMonth, selectedTeacher, selectedSubject, selectedClass]);
    
    // 3. 🚀 NEW: Filter Subject List when a Teacher is selected
    useEffect(() => {
        // Only run filtering if we have the full teacher data
        if (allTeachersMetadata.length === 0) return;

        if (selectedTeacher) {
            const teacherRecord = allTeachersMetadata.find(
                t => t.name === selectedTeacher
            );

            if (teacherRecord) {
                let filteredSubjects = new Set();
                TEACHES_TO_COLUMNS.forEach(col => {
                    if (teacherRecord[col]) {
                        filteredSubjects.add(teacherRecord[col]);
                    }
                });
                
                // Reset selected subject if it's no longer taught by this teacher
                setSelectedSubject(prev => Array.from(filteredSubjects).includes(prev) ? prev : '');

                setSubjectsList(Array.from(filteredSubjects).sort());
                return;
            }
        }
        
        // If no teacher is selected or teacher not found, reset to all subjects
        let allSubjects = new Set();
        allTeachersMetadata.forEach(teacher => {
            TEACHES_TO_COLUMNS.forEach(col => {
                if (teacher[col]) {
                    allSubjects.add(teacher[col]);
                }
            });
        });
        setSubjectsList(Array.from(allSubjects).sort());

    }, [selectedTeacher, allTeachersMetadata]);


    // ------------------------------
    // HANDLERS
    // ------------------------------
useEffect(() => {
    if (!selectedTeacher) {
        setSelectedDesignation("");
        setSelectedClasses([]);
        return;
    }

    const teacher = allTeachersMetadata.find(t => t.name === selectedTeacher);
    if (!teacher) return;

    // Get designation directly
    setSelectedDesignation(teacher.designation);

    // Get classes from teaches_to_1 → teaches_to_12
    const classes = [];
    for (let i = 1; i <= 12; i++) {
        const key = `teaches_to_${i}`;
        if (teacher[key]) {
            classes.push(teacher[key]);
        }
    }
    setSelectedClasses(classes);

}, [selectedTeacher, allTeachersMetadata]);
// --- Effect to fetch Pending Classes Only ---
useEffect(() => {
  const schoolCode = localStorage.getItem('schoolCode');

  if (!schoolCode) {
    setError("School code not found. Please log in again.");
    return;
  }

  setLoading(true);

  axios.get('https://cleezoclass.com:4000/api/pending-classes', {
    params: { schoolCode }   // send schoolCode
  })
    .then(res => setPendingClasses(res.data))
    .catch(err =>
      setError(prev =>
        (prev ? prev + ' | Failed to load pending classes' : 'Failed to load pending classes')
      )
    )
    .finally(() => setLoading(false));

}, []);



  // --- Effect to calculate scrollable height ---
  // REMOVED: calculateActionsHeight function logic
  
  useEffect(() => {
    // Initial calculation
    // REMOVED: calculateActionsHeight();
    
    // Recalculate on window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // REMOVED: calculateActionsHeight();
    };
    
    window.addEventListener("resize", handleResize);
    // Also recalculate when pending/submitted classes load in case the list is empty initially
    // REMOVED: setTimeout(calculateActionsHeight, 100); 

    return () => window.removeEventListener("resize", handleResize);
  }, [pendingClasses, submittedClasses]); // Dependency array includes data that might affect layout


  // --- Handlers for Question Paper Generator ---
  const handleClassChange = (event) => {
    const classLevel = event.target.value;
    const schoolCode = localStorage.getItem('schoolCode');
    setSelectedClass(classLevel);
    setSubjects([]);
    setSelectedSubject('');
    setQuestionPaper([]);
    setTotalMarks(0);
    setSource('');
    if (classLevel && board && schoolCode) {
      setLoading(true);
      axios.get(`https://cleezoclass.com:4000/subjects/${classLevel}/${board}?schoolCode=${schoolCode}`)
        .then((response) => {
          setSubjects(response.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Error fetching subjects');
          setLoading(false);
        });
    } else if (!schoolCode) {
      setError('School code not found. Please log in again.');
    }
  };

  const handleBoardChange = (event) => {
    const selectedBoard = event.target.value;
    setBoard(selectedBoard);
    setSubjects([]);
    setSelectedSubject('');
    setQuestionPaper([]);
    setTotalMarks(0);
    setSource('');
    if (selectedBoard && selectedClass) {
      setLoading(true);
      axios.get(`https://cleezoclass.com:4000/api/subjects/${selectedClass}/${selectedBoard}`)
        .then((response) => {
          setSubjects(response.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Error fetching subjects');
          setLoading(false);
        });
    }
  };
  const [subjects, setSubjects] = useState([
    "English", "Math", "Science", "Social Studies", "Hindi", "Computer"
  ]);
  const handleGenerateQuestionPaper = () => {
    if (!selectedClass || !selectedSubject || !examType || !board) {
      alert('Please select all fields');
      return;
    }
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
      alert('Missing school code. Please log in again.');
      return;
    }
    setLoading(true);
    setError('');
    axios.post('https://cleezoclass.com:4000/QuestionPaper', {
      class: selectedClass,
      subject: selectedSubject,
      examType,
      selectedQuestionCounts: questionCounts,
      board,
      schoolCode,
    })
      .then((response) => {
        setQuestionPaper(response.data.questions);
        setTotalMarks(response.data.totalMarks);
        setSource(response.data.source);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error generating question paper:', error.response?.data || error.message);
        setError(error.response?.data?.error || 'Error generating question paper');
        setLoading(false);
      });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Question Paper', 10, 10);
    doc.setFontSize(12);
    doc.text(`Subject: ${selectedSubject}`, 10, 20);
    doc.text(`Exam Type: ${examType}`, 10, 30);
    doc.text(`Total Marks: ${totalMarks}`, 10, 40);
    let yOffset = 50;
    ['Short Answer', 'Long Answer', 'MCQ'].forEach((type) => {
      const questions = questionPaper.filter((q) => q.question_type === type);
      if (questions.length === 0) return;
      doc.setFontSize(13);
      doc.text(type, 10, yOffset);
      yOffset += 10;
      questions.forEach((q) => {
        doc.setFontSize(12);
        const questionLines = doc.splitTextToSize(`Q${q.question_no}: ${q.question_text}`, 180);
        questionLines.forEach((line) => {
          doc.text(line, 10, yOffset);
          yOffset += 7;
        });
        if (q.marks) {
          doc.text(`(${q.marks} marks)`, 180, yOffset - 7, { align: 'right' });
        }
        if (type === 'MCQ' && Array.isArray(q.options)) {
          q.options.forEach((option, idx) => {
            doc.text(`   ${String.fromCharCode(65 + idx)}) ${option}`, 15, yOffset);
            yOffset += 6;
          });
        }
        yOffset += 5;
        if (yOffset > 270) {
          doc.addPage();
          yOffset = 10;
        }
      });
      yOffset += 5;
    });
    doc.save(`${selectedSubject}_Question_Paper_${examType}.pdf`);
  };

  // --- Handlers for Invigilator ---
const handleAssign = () => {
  const schoolCode = localStorage.getItem('schoolCode');

  if (!selectedClassInvigilator || !selectedTeacher) {
    setModalMessage('Please select both class and teacher.');
    setIsModalOpen(true);
    return;
  }

  if (!schoolCode) {
    setModalMessage('School code missing. Please login again.');
    setIsModalOpen(true);
    return;
  }

  axios.post('https://cleezoclass.com:4000/assign-invigilator', {
    class_name: selectedClassInvigilator,   // updated
  teacher_name: selectedTeacher,          // updated
  schoolCode: schoolCode
  })
    .then(res => {
      setModalMessage(res.data.message || 'Invigilator assigned successfully!');
      setIsModalOpen(true);
    })
    .catch(err => {
      console.error('Error:', err);
      setModalMessage('Error assigning invigilator. Please try again.');
      setIsModalOpen(true);
    });
};

    // Get Recommended Invigilator - UPDATED to use class and subject filters
const handleRecommendation = () => {
  const schoolCode = localStorage.getItem('schoolCode');

  if (!selectedClassInvigilator || !selectedSubjectInvigilator) {
    setModalMessage("Please select both a class and a subject first.");
    setIsModalOpen(true);
    return;
  }

  if (!schoolCode) {
    setModalMessage("School code missing. Please login again.");
    setIsModalOpen(true);
    return;
  }

  axios.get("https://cleezoclass.com:4000/api/recommended-invigilators", {
    params: {
      class_name: selectedClassInvigilator,
      subject: selectedSubjectInvigilator,
      schoolCode: schoolCode   // ✅ ADDED HERE
    }
  })
    .then(res => {
      const recommendedTeachers = res.data;

      if (recommendedTeachers && recommendedTeachers.length > 0) {
        const firstTeacher = recommendedTeachers[0].name || recommendedTeachers[0];
        setSelectedTeacher(firstTeacher);
        setModalMessage(`Recommended Invigilator: ${firstTeacher}`);
      } else {
        setSelectedTeacher('');
        setModalMessage("No recommendation available.");
      }

      setIsModalOpen(true);
    })
    .catch(err => {
      console.error("Error fetching recommendation:", err);
      setModalMessage("Error fetching recommendation.");
      setIsModalOpen(true);
    });
};



  const closeModal = () => {
    setIsModalOpen(false);
  };


  // --- Styles ---
  const styles = {
    pageContainer: {
      display: 'flex',
      flexDirection: 'column',
      // Ensure page container takes up full viewport height
      height: '100vh', 
      backgroundColor: '#fff',
          padding: "20px",

    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: '16px 16px 0 0',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
      padding: isMobile ? '15px' : '25px',
      marginBottom: isMobile ? '15px' : '25px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      gap: isMobile ? '10px' : '0',
    },
    logoBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      order: isMobile ? 1 : 0,
    },
    logo: {
      width: '40px',
      height: '40px',
      backgroundColor: '#001F3F',
      borderRadius: '8px',
    },
    logoText: { fontSize: isMobile ? '16px' : '18px', fontWeight: '600' },
    logoSub: { fontSize: isMobile ? '10px' : '12px', color: '#777' },
    schoolTitle: {
      fontSize: isMobile ? '16px' : '20px',
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
      flex: isMobile ? '1 1 100%' : 1,
      order: isMobile ? 3 : 0,
      marginTop: isMobile ? '10px' : '0',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      order: isMobile ? 2 : 0,
    },
    btn: {
      backgroundColor: '#6b7983ff',
      border: 'none',
      borderRadius: '16px',
      padding: isMobile ? '6px 10px' : '8px 16px',
      cursor: 'pointer',
      fontSize: isMobile ? '12px' : '14px',
      fontWeight: '500',
      fontFamily: font,
      color: '#fff',
    },
    mainContainer: {
      display: 'flex',
      flex: 1, // Crucial: Allows it to take remaining vertical space
      borderLeft: "8px solid #945f4aff",
      backgroundColor: "#fff",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      margin: '0 25px 25px 25px', 
      overflow: 'hidden', 
    },
    leftContainer: {
      // FIX: Changed fixed 76vw to a flexible 70vw to allow more space for the right container
      flex: '0 0 50vw', 
      padding: '20px',
      overflowY: 'auto', 
      
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
            width:'50vw',

 /* Custom scrollbar */
  scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
    },
    rightContainer: {
      // FIX: Changed fixed 20vw to flex: 1 and added overflowY: 'auto'
      flex: 1, // Takes remaining space (approx 30vw)
      padding: '20px',
      backgroundColor: '#fff',
      borderLeft: '1px solid #ddd',
      // Set to flex column to manage internal content heights
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto', // FIX: Allows the entire right container to scroll
      overflowX: 'hidden', // Prevent horizontal scroll
      /* Custom scrollbar */
  scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
    },
    questionPaperSection: {
      padding: '15px',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    },
    seatingSection: {
      padding: '20px',
      borderRadius: '8px',
    },
    headerText: {
      textAlign: 'left',
      marginBottom: '20px',
      color: '#333',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
    },
    subHeader: {
      textAlign: 'left',
      marginBottom: '15px',
      color: '#444',
      display: 'flex',
      alignItems: 'center',
    },
    cardHeader: {
      textAlign: 'left',
      fontSize: '20px',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
    },
    error: {
      color: 'red',
      textAlign: 'center',
    },
    dropdownContainer: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px',
      alignItems: 'center',
    },
    label: {
      display: 'flex',
      flexDirection: 'column',
      fontWeight: 'bold',
      width: '200px',
    },
    select: {
      padding: '8px',
      borderRadius: '16px',
      border: 'none',
      marginTop: '5px',
      backgroundColor: '#6b7983ff',
      color: '#fff',
      width: '100%',
    },
    dropdown: {
      padding: '8px 12px',
      borderRadius: '16px',
      border: 'none',
      fontSize: '14px',
      color: '#fff',
      backgroundColor: '#6b7983ff',
    },
    generatedPaper: {
      maxHeight: '400px',
      overflowY: 'auto',
      paddingRight: '10px',
      marginTop: '20px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      padding: '15px',
    },
    sectionBox: {
      marginBottom: '20px',
    },
    sectionHeader: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px',
      backgroundColor: '#f1f1f1',
      padding: '10px',
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
    },
    questionList: {
      listStyleType: 'none',
      paddingLeft: '15px',
    },
    questionItem: {
      marginBottom: '20px',
    },
    optionsList: {
      listStyleType: 'none',
      paddingLeft: '15px',
      marginTop: '5px',
    },
    marks: {
      float: 'right',
      marginLeft: '100px',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '20px',
    },
    buttonWrapper: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '20px',
    },
    button: {
      padding: '10px 20px',
      fontSize: '16px',
      backgroundColor: '#4CAF50',
      color: '#fff',
      border: 'none',
      borderRadius: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    assignButton: {
      padding: '10px 20px',
      fontSize: '16px',
      borderRadius: '8px',
      background: 'rgb(128, 128, 128)',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      marginRight: '10px', // Added margin for separation
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      },
    },
    recommendButton: { // Style for the new button
      padding: '10px 20px',
      fontSize: '16px',
      borderRadius: '8px',
      background: '#6b7983ff', // Different color for recommendation
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      },
    },
    seatingContainer: {
      padding: '30px 25px',
      borderRadius: '12px',
      textAlign: 'center',
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto',
    },
    card: {
      flex: 1,
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transition: 'box-shadow 0.3s ease',
      width:'30vw'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalBox: {
      backgroundColor: '#fff',
      padding: '30px',
      borderRadius: '10px',
      width: '350px',
      textAlign: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    },
    modalButton: {
      marginTop: '15px',
      backgroundColor: '#4CAF50',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
    },
    circle: {
      display: 'inline-block',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      marginRight: '10px',
    },
  };
const topRowContainer = { display: "flex", gap: "10px", marginBottom: "10px" ,    flexDirection: "column",   // ⬅️ This stacks containers vertically
};
    const leftColumn = { flex: 3, display: "flex", flexDirection: "column", gap: "10px" };
    const rightColumn = { flex: 2, display: "flex", flexDirection: "column", gap: "10px" };

        const headingStyle = {
        position: "absolute", top: "15px", fontSize: "20px", fontWeight: "600",
        textAlign: "center", width: "100%",
    };
    
    const bottomRowContainer = { width: "100%", display: "flex", flexDirection: "column", gap: "10px" };
    // ✨ Size Reduction: Reduced padding
    const card = {
        background: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
        flex: 1, display: "flex", flexDirection: "column",
    };
     // ✨ Size Reduction: Reduced padding
    const cardLarge = {
        background: "#fff", padding: "10px", borderRadius: "8px",
        flex: 1, display: "flex", flexDirection: "column",
    };
    // ✨ Size Reduction: Enforced smaller height
    const boxStyle = {
        flex: 1, padding: "8px", borderRight: "1px solid #ccc", borderRadius: "4px",
        textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between", height: "160px", margin: "0 2px",
    };
    const iconStyle = { fontSize: "20px", marginBottom: "5px", color: "#000" };
    const btnStyle = {
        padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
        background: "#3498db", color: "#fff", fontSize: "11px", marginTop: "5px"
    };
    
    // Placeholder for required components (need to be imported or defined)
    const ResponsiveContainer = ({ children, width, height }) => <div style={{ width, height }}>{children}</div>;
  
    const CartesianGrid = () => null;
    const XAxis = () => null;
    const YAxis = () => null;
    const Tooltip = () => null;
    const Legend = () => null;
    const Bar = () => null;
    const Line = () => null;

const TestPerformanceBarChart = ({ data }) => {
    const formatYAxis = (value) => `${value.toFixed(0)}%`;

    return (
        // ✨ Size Reduction: Height set to 200
        <ResponsiveContainer width="100%" height={100}>
            <BarChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                {/* ✨ Size Reduction: Font size set to 10px */}
                <XAxis dataKey="test_type" height={40} style={{ fontSize: '10px' }} />
                <YAxis
                    tickFormatter={formatYAxis}
                    domain={[0, 100]} // Assuming max score is 100
                    // ✨ Size Reduction: Font size set to 10px
                    style={{ fontSize: '10px' }}
                />
                <Tooltip
                    formatter={(value, name, props) => [`${value.toFixed(2)}%`, 'Avg. Score']}
                    labelFormatter={(label) => `Test Type: ${label}`}
                />
                 {/* ✨ Size Reduction: Font size set to 10px */}
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} layout="horizontal" verticalAlign="top" align="center" />
                <Bar dataKey="average_score" fill="#2980B9" name="Average Score (%)" />
            </BarChart>
        </ResponsiveContainer>
    );
};
const [teachersList, setTeachersList] = useState([]);
const [subjectsList, setSubjectsList] = useState([]);
const [studentsList, setstudentsList] = useState([]);
const [classList, setClassList]=useState([]);

// Function to safely retrieve schoolCode from LocalStorage (Assumed filter)
const getSchoolCode = () => {
    return localStorage.getItem('schoolCode');
};
const handleAssignTeacher = () => {
  console.log("Teacher Assigned");
};

const handleAssignStudent = () => {
  console.log("Student Assigned");
};

/**
 * NEW UTILITY: Converts YYYY-MM-DD date strings to DD-MM-YYYY format.
 * @param {string} dateString - The date string in YYYY-MM-DD format.
 * @returns {string} The formatted date string in DD-MM-YYYY format, or the original value if parsing fails.
 */
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Handle YYYY-MM-DD format (standard SQL date)
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${day}-${month}-${year}`;
        }
        // Handle full Date objects or timestamps if necessary (though SQL date strings are preferred)
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid date
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return dateString;
    }
};


// =======================================================
// 1. REUSABLE LEDGER POPUP COMPONENT (UPDATED for Date Format and Centering)
// =======================================================

const AcademicLedgerPopup = ({ isOpen, onClose, title, data, headers, loading }) => {
    if (!isOpen) return null;

    const modalStyle = {
        // ✨ CSS Update: Use inset: 0 for fixed full-screen coverage and centering
        position: 'fixed', inset: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1000
    };

    const contentStyle = {
        backgroundColor: '#fff', padding: '20px', borderRadius: '10px',
        width: '90%', maxWidth: '900px', 
        // ✨ CSS Update: Slightly reduced maxHeight for better screen fit
        maxHeight: '85vh', overflowY: 'auto', 
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)', position: 'relative'
    };

    const headerStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px'
    };

    const closeButtonStyle = {
        background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#e74c3c'
    };

    const tableStyle = {
        width: '100%', borderCollapse: 'collapse', fontSize: '12px'
    };

    const thTdStyle = {
        border: '1px solid #ddd', padding: '8px', textAlign: 'left'
    };

    const normalizeHeader = (key) => key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const isDateField = (key) => ['date', 'createdat', 'winning_date', 'created_at'].includes(key.toLowerCase());

    return (
        <div style={modalStyle}>
            <div style={contentStyle}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0 }}>{title} Ledger</h3>
                    <button onClick={onClose} style={closeButtonStyle} disabled={loading}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', color: '#3498db', fontWeight: 'bold' }}>Loading detailed report...</p>
                ) : data.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>No detailed data found for this report.</p>
                ) : (
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                {headers.map(header => (
                                    <th key={header} style={{ ...thTdStyle, fontWeight: 'bold' }}>{normalizeHeader(header)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex} style={{ borderBottom: '1px solid #eee' }}>
                                    {headers.map((header, colIndex) => {
                                        let cellValue = row[header] || 'N/A';
                                        
                                        // 💡 Apply DD-MM-YYYY formatting for date fields
                                        if (isDateField(header)) {
                                            cellValue = formatDate(cellValue);
                                        }

                                        return <td key={colIndex} style={thTdStyle}>{cellValue}</td>;
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

            </div>
        </div>
    );
};


/**
 * Line Chart for Performance Trend
 */
const PerformanceLineChart = ({ data }) => {
    const formatXAxis = (tickItem) => {
        const [year, month] = tickItem.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const formatYAxis = (value) => `${value.toFixed(0)}%`;

    return (
        <ResponsiveContainer width="100%" height={100}>
            <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatXAxis} height={40} style={{ fontSize: '10px' }} />
                <YAxis
                    tickFormatter={formatYAxis}
                    domain={[0, 100]} // Assuming max score is 100
                    style={{ fontSize: '10px' }}
                />
                <Tooltip
                    // 🐛 FIX: Check if value is a number before calling toFixed()
                    formatter={(value) => {
                        const formattedValue = (typeof value === 'number' && isFinite(value)) ? value.toFixed(2) : 'N/A';
                        return [`${formattedValue}%`, 'Avg. Performance'];
                    }}
                    labelFormatter={formatXAxis}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} layout="horizontal" verticalAlign="top" align="center" />
                <Line
                    type="monotone"
                    dataKey="avg_performance"
                    stroke="#e74c3c"
                    activeDot={{ r: 8 }}
                    name="Performance Trend"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

    // ACADEMIC TOTALS STATE 
    const [academicTotals, setAcademicTotals] = useState({
        monthlyAvgScore: 0,
        totalTests: 0,
        poorPerformers: 0,
        highPerformers: 0,
        unpunctualStudents: 0,
        progressReportsGenerated: 0,
        attendanceTracked: 0,
        splCount: 0, // 💡 NEW: SPL count
        loading: true,
        error: null
    });

    // Chart Data
    const [testPerformanceData, setTestPerformanceData] = useState([]);
    const [performanceTrendData, setPerformanceTrendData] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);
    
    // 🚀 NEW LEDGER STATE
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [ledgerTitle, setLedgerTitle] = useState('');
    const [ledgerData, setLedgerData] = useState([]);
    const [ledgerHeaders, setLedgerHeaders] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);


    const months = [
        "2025-01", "2025-02", "2025-03",
        "2025-04", "2025-05", "2025-06",
        "2025-07", "2025-08", "2025-09",
        "2025-10", "2025-11", "2025-12",
    ];
    // Helper for displaying academic metrics
    const formatMetric = (value, isPercent = false, isLoading = false) => {
        if (isLoading) return 'Loading...';
        if (value === null || value === undefined) return 'N/A';

        const numericValue = parseFloat(value) || 0;
        if (isPercent) {
            return `${numericValue.toFixed(2)}%`;
        }
        return numericValue.toLocaleString('en-IN');
    };

    const handleViewReport = (reportName) => {
        const monthYear = selectedMonth;

        switch (reportName) {
            case "Test Reports":
                // Corresponds to the new /all-tests-ledger endpoint
                fetchLedgerData('all-tests-ledger', ' Tests', ['name', 'class_name', 'subject', 'marks', 'test_type', 'createdAt']);
                break;
            case "Low Performance List":
                // Corresponds to the new /low-performance-list endpoint
                fetchLedgerData('low-performance-list', 'Low Performance Students (FA1 < 40)', ['name', 'class_name', 'section', 'subject', 'marks']);
                break;
            case "High Performance List":
                // Corresponds to the new /high-performance-list endpoint
                fetchLedgerData('high-performance-list', 'High Performance Students (FA1 >= 80)', ['name', 'class_name', 'section', 'subject', 'marks']);
                break;
            case "Unpunctual Students List":
                // Corresponds to the new /unpunctual-students-list endpoint, filtered by month
                fetchLedgerData('unpunctual-students-list', `Unpunctual Students (${monthYear})`, ['name', 'class', 'section', 'date', 'submission_time'], monthYear);
                break;
            case "Attendance Track Detail":
                // Corresponds to the new /attendance-detail endpoint, filtered by month
                fetchLedgerData('attendance-detail', `Attendance Detail (${monthYear})`, ['name', 'class', 'section', 'date', 'leavetype', 'submission_time'], monthYear);
                break;
            case "Generated Reports List":
                 // Corresponds to the new /generated-reports-list endpoint, filtered by month
                fetchLedgerData('generated-reports-list', `Generated Progress Reports (${monthYear})`, ['name', 'class_name', 'section', 'report', 'comment', 'created_at'], monthYear);
                break;
            case "SPL Status":
                // 💡 NEW: Case to handle SPL List (Max marks student per class/section)
                fetchLedgerData('spl-list', 'Special Project Leaders (SPL) List', ['name', 'class_name', 'section', 'marks']);
                break;
            case "Monthly Report Status":
                // Placeholder for reports not yet implemented
                alert(`Viewing report for: ${reportName}\n\nThis will open a detailed ledger report once the corresponding API is implemented.`);
                break;
            case "Test Performance Chart Detail":
            case "Performance Trend Detail":
                // These charts use data from All Tests, so link to Test Reports
                handleViewReport("Test Reports");
                break;
            default:
                alert(`Viewing report for: ${reportName}`);
                break;
        }
    };

    const [classesList, setClassesList] = useState([]);

    // 🚀 UPDATED: Fetch Dropdown Data (Teachers, Classes, Subjects)
    const fetchMetadata = async () => {
        setDropdownLoading(true);
        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setDropdownLoading(false);
            console.error("School Code not found for metadata.");
            return;
        }

        try {
            // API Endpoint to fetch all unique teachers, classes, and subjects for the school
           const response = await axios.get(
  `https://cleezoclass.com:4000/api/admin/api/metadata?schoolCode=${schoolCode}`
);

            const data = response.data; // Expected: { teachers: [{name, teaches_to_1,...}], classes: ['...'] }

            // 1. Store Full Teacher Data & Extract Names
            const teachersData = Array.isArray(data.teachers) ? data.teachers : [];
            setAllTeachersMetadata(teachersData); // Store full records
            
            // Teacher List: names from records where user_type='teacher' (assumed from teachersData)
            const uniqueTeachers = teachersData.map(t => t.name).filter(Boolean).sort();
            setTeachersList(uniqueTeachers);
            
            // 2. Classes List: All unique classes in the school
            const uniqueClasses = Array.isArray(data.classes) 
                ? data.classes.filter(Boolean).sort()
                : [];
            setClassesList(uniqueClasses);

            // 3. Subjects: Extract ALL unique subjects across all teachers for the default list
            let uniqueSubjects = new Set();
            teachersData.forEach(teacher => { // Iterate over the full teacher records
                TEACHES_TO_COLUMNS.forEach(col => {
                    if (teacher[col]) {
                        uniqueSubjects.add(teacher[col]);
                    }
                });
            });
            setSubjectsList(Array.from(uniqueSubjects).sort());

        } catch (error) {
            console.error('Error fetching metadata:', error);
        } finally {
            setDropdownLoading(false);
        }
    };
        // 🚀 NEW: Reusable Ledger Data Fetcher
    const fetchLedgerData = async (endpoint, title, defaultHeaders, monthYear = null) => {
        setLedgerLoading(true);
        setIsLedgerOpen(true);
        setLedgerTitle(title);
        setLedgerHeaders(defaultHeaders);
        setLedgerData([]); // Clear previous data

        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setLedgerLoading(false);
            return;
        }

        const monthParam = monthYear ? `&month=${monthYear}` : '';

        try {
            const response = await axios.get(`${API_BASE}/${endpoint}?schoolCode=${schoolCode}${monthParam}`);
            setLedgerData(response.data || []);
        } catch (error) {
            console.error(`Error fetching ${title} ledger data:`, error);
            setLedgerData([]);
        } finally {
            setLedgerLoading(false);
        }
    };
  // --- Render ---
  return (
    <div style={styles.pageContainer}>
      {/* Header at the top */}
  

      <div
  style={{
    fontSize: "22px",
    fontWeight: "600",
    marginBottom: "25px",
    textAlign: "left",
    fontFamily: "'Century Gothic', 'AppleGothic', sans-serif",
  }}
>
  OPERATIONS – ACADEMIC-STAFF 
</div>

      {/* Main content area */}
      <div style={styles.mainContainer}>
  <div style={styles.leftContainer}>
          {/* Question Paper Generator Section */}
        <div style={{ marginBottom: "20px", textAlign: "center", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
                     <label htmlFor="global-month-select" style={{ fontSize: "14px", marginRight: "10px", fontWeight: "600" }}>
                         Select Month for Monthly Reports:
                     </label>
                     <select
                         id="global-month-select"
                         style={{ padding: "8px", fontSize: "14px", borderRadius: "6px", border: "1px solid #3498db", minWidth: "150px" }}
                         value={selectedMonth}
                         onChange={(e) => setSelectedMonth(e.target.value)}
                     >
                         <option value="">Select Month</option>
                         {months.map((m) => (
                             <option key={m} value={m}>{m}</option>
                         ))}
                     </select>
                     <button
                         onClick={handleRefresh}
                         style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", marginLeft: "10px", cursor: "pointer", background: "#f0f0f0" }}
                         disabled={academicTotals.loading || chartLoading}
                     >
                         <FontAwesomeIcon icon={faSync} />
                     </button>
                 </div>

          <div style={{ ...styles.questionPaperSection, display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'left', textAlign: 'left', width: '45vw' }}>
        
                             <div style={leftColumn}>
                                     <div style={cardLarge}>
                                                           <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "600", borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                                                <FontAwesomeIcon icon={faChartBar} style={{ marginRight: "5px" }} />
                                                                Academic Performance Charts
                                                           </h3>
                               
                                                            {/* START: Side-by-Side Chart Container */}
                                                             <div style={{
                                                                display: "flex",
                                                                gap: "10px", 
                                                                marginBottom: "15px",
                                                                borderBottom: "1px solid #eee",
                                                                paddingBottom: "15px",
                                                                flexWrap: "wrap", 
                                                            }}>
                                                                
                                                                {/* Bar Chart */}
                                                                <div style={{ flex: 1, minWidth: '45%', minHeight: '200px' , borderRight:'1px solid #ccc'}}>
                                                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", textAlign: 'center' }}>Test Performance</h4>
                                                                    {chartLoading ? (
                                                                       <p style={{ textAlign: 'center', fontSize: '12px', color: '#888' }}>Loading Chart Data...</p>
                                                                   ) : (
                                                                        <TestPerformanceBarChart data={testPerformanceData} />
                                                                    )}
                                                                
                                                                     <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                                                <button
                                                                    onClick={() => handleViewReport("Test Performance Chart Detail")} 
                                                                    style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(141,171,182,1)", color: "#fff", border: "none",marginBottom:'40px', cursor: "pointer", fontSize: "12px", width: "150px" }}
                                                                >view Report
                                                                </button>
                                                            </div>
                                         {/* 🚀 FILTER ROW: TEACHER, SUBJECT, AND CLASS FILTERS (Moved below Month selector) */}
                               <div
                                   style={{
                                       marginBottom: "20px",
                                       textAlign: "center",
                                       borderBottom: "1px solid #ddd",
                                       paddingBottom: "10px",
                                       display: "flex",
                                       justifyContent: "center",
                                       flexWrap: "wrap",
                                       gap: "15px"
                                   }}
                               >
                                   {dropdownLoading ? (
                                       <p style={{ fontSize: "14px", color: "#3498db" }}>Loading filters...</p>
                                   ) : (
                                       <>
                                           {/* 🔹 CENTER TITLE */}
                                           <h2
                                               style={{
                                                   width: "100%",
                                                   textAlign: "center",
                                                   marginBottom: "5px",
                                                   fontWeight: "700"
                                               }}
                                           >
                                               Low Performer
                                           </h2>
                               
                                           {/* 🔹 ACTION BUTTONS */}
                                       
                               
                                           {/* 🔹 TEACHER DROPDOWN */}
                                           <div>
                                               <label
                                                   htmlFor="teacher-select"
                                                   style={{
                                                       fontSize: "14px",
                                                       marginRight: "10px",
                                                       fontWeight: "600"
                                                   }}
                                               >
                                                   Teacher:
                                               </label>
                               
                                               <select
                                                   id="teacher-select"
                                                   style={{
                                                       padding: "8px",
                                                       fontSize: "14px",
                                                       borderRadius: "6px",
                                                       border: "1px solid #2980B9",
                                                       minWidth: "150px"
                                                   }}
                                                   value={selectedTeacher}
                                                   onChange={(e) => setSelectedTeacher(e.target.value)}
                                               >
                                                   <option value=""> Teachers</option>
                                                   {teachersList.map((teacher) => (
                                                       <option key={teacher} value={teacher}>
                                                           {teacher}
                                                       </option>
                                                   ))}
                                               </select>
                                           </div>
                               
                                           {/* 🔹 SUBJECT DISPLAY */}
                                           <div>
                                               <label
                                                   style={{
                                                       fontSize: "14px",
                                                       marginRight: "10px",
                                                       fontWeight: "600"
                                                   }}
                                               >
                                                   Subject
                                               </label>
                                               <span style={{ fontSize: "14px" }}>
                                                   {selectedDesignation || "Not Available"}
                                               </span>
                                           </div>
                               
                                           {/* 🔹 CLASS DISPLAY */}
                                           <div>
                                               <label
                                                   style={{
                                                       fontSize: "14px",
                                                       marginRight: "10px",
                                                       fontWeight: "600"
                                                   }}
                                               >
                                                   Classes:
                                               </label>
                                               <span style={{ fontSize: "14px" }}>
                                                   {selectedClasses.length > 0
                                                       ? selectedClasses.join(", ")
                                                       : "Not Available"}
                                               </span>
                                           </div>
                                               <div style={{ width: "100%", textAlign: "center", marginBottom: "10px" }}>
                                               <button
                                                   style={{
                                                       padding: "8px 15px",
                                                       marginRight: "10px",
                                                       borderRadius: "6px",
                                                       border: "none",
                                                       backgroundColor: "#5a7488",
                                                       color: "white",
                                                       cursor: "pointer",
                                                       fontWeight: "600"
                                                   }}
                                                   onClick={handleReportTeacher}
                                               >
                                                   Report Teacher
                                               </button>
                               
                                               <button
                                                   style={{
                                                       padding: "8px 15px",
                                                       borderRadius: "6px",
                                                       border: "none",
                                                       backgroundColor: "#5a7488",
                                                       color: "white",
                                                       cursor: "pointer",
                                                       fontWeight: "600"
                                                   }}
                                                   onClick={handleComplainAdmin}
                                               >
                                                   Complain Super Admin
                                               </button>
                                           </div>
                                       </>
                                   )}
                               </div>
                               
                               
                                                                </div>
                                
                                                                {/* Line Chart */}
                                                                <div style={{ flex: 1, minWidth: '45%', minHeight: '200px' }}>
                                                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", textAlign: 'center' }}>Performance Graph</h4>
                                                                    {chartLoading ? (
                                                                       <p style={{ textAlign: 'center', fontSize: '12px', color: '#888' }}>Loading Chart Data...</p>
                                                                    ) : (
                                                                        <PerformanceLineChart data={performanceTrendData} />
                                                                    )}
                                                                   
                                                                     <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                                                <button
                                                                    onClick={() => handleViewReport("Performance Trend Detail")} 
                                                                    style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(141,171,182,1)", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", width: "150px", marginBottom:'40px' }}
                                                                >view Report
                                                                </button>
                                                            </div>
                                                               {/* 🚀 FILTER ROW: TEACHER, SUBJECT, AND CLASS FILTERS (Moved below Month selector) */}
                                 <div
                                   style={{
                                       marginBottom: "20px",
                                       textAlign: "center",
                                       borderBottom: "1px solid #ddd",
                                       paddingBottom: "10px",
                                       display: "flex",
                                       justifyContent: "center",
                                       flexWrap: "wrap",
                                       gap: "15px"
                                   }}
                               >
                                   {dropdownLoading ? (
                                       <p style={{ fontSize: "14px", color: "#3498db" }}>Loading filters...</p>
                                   ) : (
                                       <>
                                           {/* 🔹 CENTER TITLE */}
                                           <h2
                                               style={{
                                                   width: "100%",
                                                   textAlign: "center",
                                                   marginBottom: "5px",
                                                   fontWeight: "700"
                                               }}
                                           >
                                               Low Performer
                                           </h2>
                               
                                           {/* 🔹 ACTION BUTTONS */}
                                       
                               
                                           {/* 🔹 TEACHER DROPDOWN */}
                                           <div>
                                               <label
                                                   htmlFor="teacher-select"
                                                   style={{
                                                       fontSize: "14px",
                                                       marginRight: "10px",
                                                       fontWeight: "600"
                                                   }}
                                               >
                                                   Teacher:
                                               </label>
                               
                                               <select
                                                   id="teacher-select"
                                                   style={{
                                                       padding: "8px",
                                                       fontSize: "14px",
                                                       borderRadius: "6px",
                                                       border: "1px solid #2980B9",
                                                       minWidth: "150px"
                                                   }}
                                                   value={selectedTeacher}
                                                   onChange={(e) => setSelectedTeacher(e.target.value)}
                                               >
                                                   <option value=""> Teachers</option>
                                                   {teachersList.map((teacher) => (
                                                       <option key={teacher} value={teacher}>
                                                           {teacher}
                                                       </option>
                                                   ))}
                                               </select>
                                           </div>
                               
                                           {/* 🔹 SUBJECT DISPLAY */}
                                           <div>
                                               <label
                                                   style={{
                                                       fontSize: "14px",
                                                       marginRight: "10px",
                                                       fontWeight: "600"
                                                   }}
                                               >
                                                   Subject
                                               </label>
                                               <span style={{ fontSize: "14px" }}>
                                                   {selectedDesignation || "Not Available"}
                                               </span>
                                           </div>
                               
                                           {/* 🔹 CLASS DISPLAY */}
                                           <div>
                                               <label
                                                   style={{
                                                       fontSize: "14px",
                                                       marginRight: "10px",
                                                       fontWeight: "600"
                                                   }}
                                               >
                                                   Classes:
                                               </label>
                                               <span style={{ fontSize: "14px" }}>
                                                   {selectedClasses.length > 0
                                                       ? selectedClasses.join(", ")
                                                       : "Not Available"}
                                               </span>
                                           </div>
                                               <div style={{ width: "100%", textAlign: "center", marginBottom: "10px" }}>
                                               <button
                                                   style={{
                                                       padding: "8px 15px",
                                                       marginRight: "10px",
                                                       borderRadius: "6px",
                                                       border: "none",
                                                       backgroundColor: "#5a7488",
                                                       color: "white",
                                                       cursor: "pointer",
                                                       fontWeight: "600"
                                                   }}
                                                   onClick={handleReportTeacher}
                                               >
                                                   Report Teacher
                                               </button>
                               
                                               <button
                                                   style={{
                                                       padding: "8px 15px",
                                                       borderRadius: "6px",
                                                       border: "none",
                                                       backgroundColor: "#5a7488",
                                                       color: "white",
                                                       cursor: "pointer",
                                                       fontWeight: "600"
                                                   }}
                                                   onClick={handleComplainAdmin}
                                               >
                                                   Complain Super Admin
                                               </button>
                                           </div>
                                       </>
                                   )}
                               </div>
                               
                               
                               
                                                                </div>
                                                            </div>
                                                        
                                                        </div>
                             </div>
        
                           
                         </div>
      
          <div style={{ ...styles.questionPaperSection, display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'left', textAlign: 'left', width: '45vw' }}>
            <h1 style={{ ...styles.headerText, textAlign: 'left' }}>
              <span style={{ ...styles.circle, backgroundColor: '#D4C7B0' }} /> Question Paper Generator
            </h1>
            {error && <p style={styles.error}>{error}</p>}
            <div style={{ ...styles.dropdownContainer, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '20px', textAlign: 'center', width: '80%', margin: '20px 0' }}>
          
              <label style={styles.label}>
                Select Class:
                <select onChange={handleClassChange} style={styles.select}>
                  <option value="">Select Class</option>
                  <option value="0">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  {[...Array(10).keys()].map((i) => (
                    <option key={i + 1} value={i + 1}>
                      Class {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label style={styles.label}>
                Select Subject:
                <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={styles.select}>
                  <option value="">--Select--</option>
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>
              <label style={styles.label}>
                Select Exam Type:
                <select value={examType} onChange={(e) => setExamType(e.target.value)} style={styles.select}>
                  <option value="">--Select--</option>
                  <option>Mid</option>
                  <option>Term</option>
                  <option>Quarterly</option>
                  <option>Half-Yearly</option>
                  <option>Annual</option>
                </select>
              </label>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={handleGenerateQuestionPaper}
                  disabled={loading}
                  style={{ ...styles.button, backgroundColor: loading ? '#cccccc' : '#6b7983ff' }}
                >
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>

            {examType && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '30px', width: '80%', margin: '20px 0', textAlign: 'center' }}>
                {['Short Answer', 'Long Answer', 'MCQ'].map((type) => (
                  <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '300px', width: '100%', textAlign: 'center' }}>
                    <span style={{ marginBottom: '8px', fontWeight: 'bold' }}>Number of {type} Questions:</span>
                    <select
                      value={questionCounts[type]}
                      onChange={(e) => setQuestionCounts({ ...questionCounts, [type]: parseInt(e.target.value) })}
                      style={{ padding: '12px', width: '80%', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1em', outline: 'none' }}
                    >
                      {[...Array(11)].map((_, index) => (
                        <option key={index} value={index}>
                          {index}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                      <strong>Selected:</strong> {questionCounts[type]} {questionCounts[type] === 1 ? 'question' : 'questions'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {questionPaper.length > 0 && (
              <div style={{ ...styles.generatedPaper, textAlign: 'center', alignItems: 'center', justifyContent: 'center', width: '80%' }}>
                <h3 style={styles.subHeader}>
                  <span style={{ ...styles.circle, backgroundColor: '#FF9800' }} /> Generated Question Paper
                </h3>
                <p><strong>Subject:</strong> {selectedSubject}</p>
                <p><strong>Exam Type:</strong> {examType}</p>
                <p><strong>Total Marks:</strong> {totalMarks}</p>
                <p><strong>Source:</strong> {source}</p>
                {['Short Answer', 'Long Answer', 'MCQ'].map((type) => {
                  const questionsOfType = questionPaper.filter((q) => q.question_type === type);
                  if (questionsOfType.length === 0) return null;
                  return (
                    <div key={type} style={styles.sectionBox}>
                      <div style={styles.sectionHeader}>
                        <span style={{ ...styles.circle, backgroundColor: '#2196F3' }} /> {type}
                      </div>
                      <ul style={{ ...styles.questionList, textAlign: 'left', display: 'inline-block' }}>
                        {questionsOfType.map((q, idx) => (
                          <li key={idx} style={styles.questionItem}>
                            <div>
                              <strong>{q.question_no}.</strong> {q.question_text}
                              <span style={styles.marks}>({q.marks} marks)</span>
                            </div>
                            {type === 'MCQ' && Array.isArray(q.options) && q.options.length > 0 && (
                              <ul style={styles.optionsList}>
                                {q.options.map((option, optIdx) => (
                                  <li key={optIdx}>
                                    <strong>{String.fromCharCode(65 + optIdx)})</strong> {option}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button onClick={handleDownloadPDF} style={styles.button}>
                    <Download size={16} /> Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
     
          {/* Scan & Pull and Invigilator Sections */}
          <div style={{ display: 'flex', gap: '20px', padding: '15px', boxSizing: 'border-box', width:'45vw' }}>
            <div style={styles.card}>
              <h2 style={styles.cardHeader}>
                <span style={{ ...styles.circle, backgroundColor: '#B5ACBC' }} /> Scan & Pull
              </h2>
              <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', borderRadius: '10px' }}>
               
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <select style={{ padding: '5px', borderRadius:'16px' , backgroundColor:'#6b7983ff', width:'100px', color:'white'}}>
                    <option value=""> Pending </option>
                    {loading ? (
                      <option>Loading...</option>
                    ) : pendingClasses.length > 0 ? (
                      pendingClasses.map((cls, idx) => (
                        <option key={idx} value={`${cls.class_name}-${cls.section}`}>
                          Class {cls.class_name} Section {cls.section}
                        </option>
                      ))
                    ) : (
                      <option disabled>No Pending Classes</option>
                    )}
                  </select>
                  <select style={{ padding: '5px', borderRadius:'16px' , backgroundColor:'#6b7983ff',width:'100px',color:'white'}}>
                    <option value="">Remind</option>
                    <option value="SMS">Send SMS Reminder</option>
                    <option value="Email">Send Email</option>
                    <option value="Call">Call Parent</option>
                  </select>
                </div>
              </div>
            </div>
          <div style={styles.card}>
      <h2 style={styles.cardHeader}>
        <span style={{ ...styles.circle, backgroundColor: "#A39DBD" }} /> Invigilator
      </h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "30px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            style={styles.dropdown}
            value={selectedClassInvigilator}
            onChange={(e) => setSelectedClassInvigilator(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.map((cls, index) => (
              <option key={index} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* ADDED: Subject selection for recommendations */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            style={styles.dropdown}
            value={selectedSubjectInvigilator}
            onChange={(e) => setSelectedSubjectInvigilator(e.target.value)}
          >
            <option value="">Select Subject</option>
             {/* Using the subjects list populated by the QP generator */}
            {subjects.map((subj, index) => (
              <option key={index} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
<select
  style={styles.dropdown}
  value={selectedTeacher}
  onChange={(e) => setSelectedTeacher(e.target.value)}
>
  <option value="">Select Teacher</option>
  {teachers.map((t) => (
    <option key={t.id} value={t.id}>
      {t.name}
    </option>
  ))}
</select>

        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button style={styles.assignButton} onClick={handleAssign}>
          Assign
        </button>
        <button style={styles.recommendButton} onClick={handleRecommendation}>
          Recommend
        </button>
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3>{modalMessage}</h3>
            <button style={styles.modalButton} onClick={closeModal}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
          </div>
        </div>
        {/* --- RIGHT CONTAINER: DISPLAYING PENDING AND SUBMITTED CLASSES --- */}
        <div style={styles.rightContainer} ref={rightContainerRef}>
          
          {/* 1. ACTIONS CONTAINER */}
       <div 
  style={{
    padding: "15px", 
    background: "#fff", 
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "20px", 
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    height:'300px',
    display: "flex",
    flexDirection: "column",
    paddingRight: '5px',
  }}
>
  <h3 
    ref={actionsHeaderRef} 
    style={{ 
      borderBottom: '2px solid #333', 
      paddingBottom: '5px', 
      marginBottom: '10px', 
      color: '#333', 
      fontSize: '18px' 
    }}
  >
    Actions ({pendingClasses.length + submittedClasses.length})
  </h3>

  {/* Scrollable content area */}
  <div 
    style={{ 
      flex: 1,               // Fills remaining height under header
      overflowY: "auto",     // Enables scroll
      paddingRight: '5px',
    }}
  >
    {[...pendingClasses.map(c => ({ ...c, status: 'Pending' })),
      ...submittedClasses.map(c => ({ ...c, status: 'Submitted' }))
    ]
    .filter(cls => !dismissedClasses.includes(`${cls.class_name}-${cls.section}`))
    .map((cls, idx) => (
      <div
        key={`class-${idx}`}
        style={{
          marginBottom: '15px',
          padding: '8px 10px',
          borderRadius: '5px',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#f9f9f9',
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
          <FontAwesomeIcon icon={faArrowRight} style={{ marginRight: '8px', fontSize: '14px' }} />
          Scan & Pull
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontWeight: '500' }}>
            Class {cls.class_name} Section {cls.section}
            <span style={{ marginLeft: '5px', color: '#000' }}>
              {cls.status}
            </span>
          </div>

          <button
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#6b7983ff',
              color: '#fff',
              marginLeft: 'auto',
            }}
            onClick={() => {
              const classKey = `${cls.class_name}-${cls.section}`;
              const newDismissed = [...dismissedClasses, classKey];
              setDismissedClasses(newDismissed);
              localStorage.setItem('dismissedClasses', JSON.stringify(newDismissed));
            }}
          >
            OK
          </button>
        </div>
      </div>
    ))}
  </div>
</div>

          
          {/* 2. ASSIGN STAFF/STUDENT CONTAINER */}
          <div 
            style={{
              padding: "15px",
              background: "#f7f7f7",
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}
          >

  {/* ASSIGN STAFF */}
  <h3 style={{ 
    borderBottom: "2px solid #333",
    paddingBottom: "5px",
    marginBottom: "10px",
    color: "#333",
    fontSize: "18px"
  }}>
    Assign Staff
  </h3>

  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

    {/* Teacher Dropdown */}
    <select style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}>
      <option>Select Teacher</option>
      {teachersList?.map((t, idx) => (
        <option key={idx} value={t.teacher_id}>{t.teacher_name}</option>
      ))}
    </select>

    {/* Subject Dropdown */}
    <select style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}>
      <option>Select Subject</option>
      {subjectsList?.map((sub, idx) => (
        <option key={idx} value={sub.subject_id}>{sub.subject_name}</option>
      ))}
    </select>

    {/* Assign Button */}
    <button
      style={{
        padding: "6px",
        borderRadius: "4px",
        backgroundColor: "#6b7983ff",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        width: "120px"
      }}
      onClick={handleAssignTeacher}
    >
      Assign
    </button>

  </div>

  {/* ASSIGN STUDENT */}
  <h3 style={{ 
    borderBottom: "2px solid #333",
    paddingBottom: "5px",
    marginTop: "20px",
    marginBottom: "10px",
    color: "#333",
    fontSize: "18px"
  }}>
    Assign Student
  </h3>

  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

    {/* Student Dropdown */}
    <select style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}>
      <option>Select Student</option>
      {studentsList?.map((s, idx) => (
        <option key={idx} value={s.user_id}>{s.name}</option>
      ))}
    </select>

    {/* Position Dropdown */}
    <select style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}>
      <option>Select Position</option>
      <option>Leader</option>
      <option>Assistant</option>
      <option>Monitor</option>
    </select>

    {/* Class Dropdown */}
    <select style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}>
      <option>Select Class</option>
      {classList?.map((c, idx) => (
        <option key={idx}>{c.class_name} {c.section}</option>
      ))}
    </select>

    {/* Assign Student Button */}
    <button
      style={{
        padding: "6px",
        borderRadius: "4px",
        backgroundColor: "#738368ff",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        width: "140px"
      }}
      onClick={handleAssignStudent}
    >
      Assign Student
    </button>
  </div>

</div>

        </div>
      </div>
          <AcademicLedgerPopup
                 isOpen={isLedgerOpen}
                 onClose={() => setIsLedgerOpen(false)}
                 title={ledgerTitle}
                 data={ledgerData}
                 headers={ledgerHeaders}
                 loading={ledgerLoading}
             />
    </div>
  );
};

export default ExamDashboard;