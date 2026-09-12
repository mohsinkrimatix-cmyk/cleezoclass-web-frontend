import axios from 'axios';
import jsPDF from 'jspdf';
import React, { useState, useRef, useEffect } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import TwoButtons from '../shared/SeatingArrangmentClasswise';
import ObjectionCertificate from '../shared/ObjectionCertificate1';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import '@fortawesome/fontawesome-free/css/all.min.css';

import './AcademicStaff.css'
import {
    faBookReader, faExclamationCircle, faAward, faChartBar, faSync, faChartLine,
    faClock, faUsers, faTimes // faTimes is needed for the popup close button
} from "@fortawesome/free-solid-svg-icons";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import ErrorPopup from '../shared/ErrorPopup';
    const API_BASE = 'https://cleezoclass.com:4000/api/'; // Match your backend PORT

const ExamDashboard = ({ compactMode = false } = {}) => {
  const [popup, setPopup] = useState({ message: "", type: "" });

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
  const [selectedSubTopic, setSelectedSubTopic] = useState("");
  // New Syllabus/Chapter Selection State
  const [chapterCode, setChapterCode] = useState('101');
  const [extractedTopics, setExtractedTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);

  const chapterMapping = [
    { label: "Chapter 1", code: "101" },
    { label: "Chapter 2", code: "102" },
    { label: "Chapter 3", code: "103" },
    { label: "Chapter 4", code: "104" },
    { label: "Chapter 5", code: "105" },
  ];
const getOrdinal = (n) => {
  const j = n % 10,
        k = n % 100;
  if (j === 1 && k !== 11) return n + "st";
  if (j === 2 && k !== 12) return n + "nd";
  if (j === 3 && k !== 13) return n + "rd";
  return n + "th";
};

const gradeSubjectName = (subject) => {
  if (!subject) return "";
  return subject.toLowerCase() === "math" ? "maths" : subject.toLowerCase();
};

const fetchSyllabusTopics = async () => {
  setLoading(true);
  try {
    const formattedGrade = `${getOrdinal(selectedClass)} ${gradeSubjectName(selectedSubject)}`;
    const subjectUpper = selectedSubject.toUpperCase();

    console.log("FINAL SUBJECT:", subjectUpper);
    console.log("FINAL GRADE:", formattedGrade);

    const res = await axios.get(
      "https://cleezoclass.com:4000/api/extract-topics",
      {
        params: {
          subject: subjectUpper,
          grade: formattedGrade,
          fileCode: chapterCode,
        },
      }
    );

    setExtractedTopics(res.data.subTopics || []);

    // ✅ Optional polite success popup
    setPopup({
      message: "Topics have been successfully loaded.",
      type: "success"
    });

  } catch (err) {
    console.error("Error fetching syllabus topics:", err);
    setPopup({
      message: "Oops! We couldn't read the syllabus file. Please try again.",
      type: "error"
    });
  } finally {
    setLoading(false);
  }
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
        setPopup('Web Share API not supported in this browser.');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };
  // The container click handler to update active content
  const handleContainerClick = (content) => {
    setActiveContent(content); // Update active content
  };
const handleGenerate = async () => {
  if (selectedTopics.length === 0) {
setPopup({
  message: "Kindly select at least one sub-topic before proceeding.",
  type: "error"
});
    return;
  }

  setLoading(true);
  try {
    // We send the parameters needed to reconstruct the file path
    const response = await axios.post('https://cleezoclass.com:4000/QuestionPaper', {
      subject: selectedSubject.toUpperCase(), // e.g., "MATH"
      grade: `${getOrdinal(selectedClass)} ${gradeSubjectName(selectedSubject)}`, // e.g., "7th maths"
      fileCode: chapterCode, 
      selectedQuestionCounts: questionCounts,
      topics: selectedTopics, // The array of sub-topic titles
      schoolCode: localStorage.getItem('schoolCode'),
    });
    
    setQuestionPaper(response.data.questions);
    setShowQuestionPopup(true);
  } catch (error) {
setPopup({
  message: "Oops! We couldn’t generate the paper from the selected topics. Please try again.",
  type: "error"
});
  }
  setLoading(false);
};
  const toggleTopicSelection = (topicTitle) => {
    setSelectedTopics(prev => 
      prev.includes(topicTitle) ? prev.filter(t => t !== topicTitle) : [...prev, topicTitle]
    );
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

  // --- State for Scan & Pull ---
  const [selectedClassScan, setSelectedClassScan] = useState('');
  const [selectedSectionScan, setSelectedSectionScan] = useState('');
  const [unpaidStudents, setUnpaidStudents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [recentActions, setRecentActions] = useState(() => {
    try {
      const saved = localStorage.getItem("adminAcademicStaffRecentActions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pendingClasses, setPendingClasses] = useState([]);
  const [submittedClasses, setSubmittedClasses] = useState([]);
const [selectedDesignation, setSelectedDesignation] = useState("");
const [selectedClasses, setSelectedClasses] = useState([]);
const fetchComplaints = async () => {
  try {
    const schoolCode = localStorage.getItem("schoolCode");
    const res = await axios.get("https://cleezoclass.com:4000/api/complaints", {
      params: { schoolCode }
    });

    console.log("Complaints API==========================:", res.data);   // 👈 DEBUG
    setComplaints(res.data || []);
  } catch (err) {
    console.error("Error fetching complaints:", err);
  }
};

const addRecentAction = (title, detail) => {
  const newAction = {
    id: Date.now(),
    title,
    detail,
    createdAt: new Date().toISOString(),
  };
  setRecentActions(prev => [newAction, ...prev].slice(0, 20));
};

const openComplaintModal = (complaint) => {
  setSelectedComplaint(complaint);
  addRecentAction(
    "Viewed complaint/report",
    complaint?.teacher
      ? `${complaint.type === "teacher_report" ? "Report" : "Complaint"} | ${complaint.teacher}`
      : `${complaint.type === "teacher_report" ? "Report" : "Complaint"}`
  );
};

const closeComplaintModal = () => {
  setSelectedComplaint(null);
};

useEffect(() => {
  localStorage.setItem("adminAcademicStaffRecentActions", JSON.stringify(recentActions));
}, [recentActions]);

useEffect(() => {
  fetchComplaints();
}, []);

const handleReportTeacher = async ({ teacher, subject, classes }) => {
  if (!teacher) {
    setPopup({ message: "Please select a teacher to report.", type: "error" });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000); // Clear after 3 seconds
    return;
  }

  try {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
      setPopup({ message: "School code not found. Cannot send report.", type: "error" });
      setTimeout(() => setPopup({ message: "", type: "" }), 3000);
      return;
    }

    await axios.post("https://cleezoclass.com:4000/api/complaints", {
      schoolCode,
      type: "teacher_report",
      teacher,
      subject,
      classes,
      message: `Report for ${teacher}`,
    });

    addRecentAction(
      "Teacher report submitted",
      `${teacher} | ${subject || "Subject N/A"} | ${Array.isArray(classes) ? classes.join(", ") : classes || "Classes N/A"}`
    );

    setPopup({ message: "Report sent to Super Admin successfully!", type: "success" });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  } catch (err) {
    console.error(err);
    setPopup({ message: "Failed to send report.", type: "error" });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  }
};

const handleComplainAdmin = async ({ teacher, subject, classes, message }) => {
    if (!teacher) {
    setPopup({ message: "Please select a teacher to complaint.", type: "error" });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000); // Clear after 3 seconds
    return;
  }

  try {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
      setPopup({ message: "School code not found. Cannot send complaint.", type: "error" });
      setTimeout(() => setPopup({ message: "", type: "" }), 3000); // Clear after 3 seconds
      return;
    }

    await axios.post("https://cleezoclass.com:4000/api/complaints", {
      schoolCode,
      type: "admin_complaint",
      teacher,
      subject,
      classes,
      message: message || "Complaint to Super Admin",
    });

    addRecentAction(
      "Complaint submitted",
      `${teacher} | ${subject || "Subject N/A"} | ${Array.isArray(classes) ? classes.join(", ") : classes || "Classes N/A"}`
    );

    setPopup({ message: "Complaint sent to Super Admin successfully!", type: "success" });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000); // Clear after 3 seconds
  } catch (err) {
    console.error(err);
    setPopup({ message: "Failed to send complaint.", type: "error" });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000); // Clear after 3 seconds
  }
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
  if (!selectedTeacher) {
    setInvigilatorDesignation("");
    setInvigilatorClasses([]);
    // Reset subjectsList to all subjects if no teacher is selected
    const allSubjects = new Set();
    allTeachersMetadata.forEach(teacher => {
      if (teacher.designation) {
        allSubjects.add(teacher.designation.trim());
      }
    });
    setSubjectsList(Array.from(allSubjects).sort());
    return;
  }

  const teacher = allTeachersMetadata.find(t => t.name === selectedTeacher);
  if (!teacher) return;

  // Set the Designation (This is usually their primary Subject)
  setInvigilatorDesignation(teacher.designation || "");

  // Extract classes from teaches_to_1 through teaches_to_12
  const classesFound = [];
  for (let i = 1; i <= 12; i++) {
    const val = teacher[`teaches_to_${i}`];
    if (val) classesFound.push(val);
  }
  setInvigilatorClasses(classesFound);

  // Update subjectsList to only include the selected teacher's subjects (or designations)
  const teacherSubjects = teacher.designation ? [teacher.designation] : [];
  setSubjectsList(teacherSubjects);
}, [selectedTeacher, allTeachersMetadata]);


    // ------------------------------
    // HANDLERS
    // ------------------------------

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
    setPopup('Please select all fields');
    return;
  }

  const schoolCode = localStorage.getItem('schoolCode');
  if (!schoolCode) {
    setPopup('Missing school code. Please log in again.');
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

      // ⭐ OPEN POPUP HERE
      setShowQuestionPopup(true);
    })
    .catch((error) => {
      console.error('Error generating question paper:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Error generating question paper');
      setLoading(false);
    });
};


const handleDownloadPDF = () => {
  const doc = new jsPDF();

  // ===== Title =====
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Question Paper", 105, 15, { align: "center" });

  // ===== Subject | Exam | Marks (one line) =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Subject: ${selectedSubject}   |   Exam Type: ${examType}   |   Total Marks: ${totalMarks}`,
    105,
    25,
    { align: "center" }
  );

  let yOffset = 40;

  ["Short Answer", "Long Answer", "MCQ"].forEach((type) => {
    const questions = questionPaper.filter(
      (q) => q.question_type === type
    );
    if (!questions.length) return;

    // ===== Section Heading (BOLD) =====
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(type, 10, yOffset);
    yOffset += 8;

    questions.forEach((q) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      const questionLines = doc.splitTextToSize(
        `${q.question_no}. ${q.question_text}`,
        180
      );

      questionLines.forEach((line) => {
        doc.text(line, 10, yOffset);
        yOffset += 7;
      });

      // Marks aligned right
      if (q.marks) {
        doc.text(`(${q.marks} marks)`, 200, yOffset - 7, {
          align: "right",
        });
      }

      // MCQ Options
      if (type === "MCQ" && Array.isArray(q.options)) {
        q.options.forEach((option, idx) => {
          doc.text(
            `${String.fromCharCode(65 + idx)}) ${option}`,
            15,
            yOffset
          );
          yOffset += 6;
        });
      }

      yOffset += 5;

      // Page break
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
    });

    yOffset += 6;
  });

  doc.save(`${selectedSubject}_Question_Paper_${examType}.pdf`);
};

const [invigilatorDesignation, setInvigilatorDesignation] = useState("");
const [invigilatorClasses, setInvigilatorClasses] = useState([]);

useEffect(() => {
    if (!selectedTeacher) {
        setInvigilatorDesignation("");
        setInvigilatorClasses([]);
        return;
    }

    // Find the teacher in your metadata
    const teacher = allTeachersMetadata.find(t => t.id === selectedTeacher || t.name === selectedTeacher);
    
    if (teacher) {
        // Set the Designation (This is usually their primary Subject)
        setInvigilatorDesignation(teacher.designation || "");

        // Extract classes from teaches_to_1 through teaches_to_12
        const classesFound = [];
        for (let i = 1; i <= 12; i++) {
            const val = teacher[`teaches_to_${i}`];
            if (val) classesFound.push(val);
        }
        setInvigilatorClasses(classesFound);
    }
}, [selectedTeacher, allTeachersMetadata]);
  // --- Handlers for Invigilator ---
const handleAssign = () => {
  const schoolCode = localStorage.getItem('schoolCode');

  if (!selectedClassInvigilator || !selectedTeacher) {
    setPopup({
      message: "Kindly select both class and teacher before proceeding.",
      type: "error"
    });
    return;
  }

  if (!schoolCode) {
    setPopup({
      message: "School code is missing. Please log in again.",
      type: "error"
    });
    return;
  }

  axios.post('https://cleezoclass.com:4000/assign-invigilator', {
    class_name: selectedClassInvigilator,
    teacher_name: selectedTeacher,
    schoolCode: schoolCode
  })
    .then(res => {
      setPopup({
        message: res.data.message || 'Invigilator assigned successfully!',
        type: "success"
      });
    })
    .catch(err => {
      console.error('Error:', err);
      setPopup({
        message: 'Oops! Something went wrong while assigning the invigilator. Please try again.',
        type: "error"
      });
    });
};


    // Get Recommended Invigilator - UPDATED to use class and subject filters
const handleRecommendation = () => {
  const schoolCode = localStorage.getItem('schoolCode');

  if (!selectedClassInvigilator || !selectedSubjectInvigilator) {
    setPopup("Please select both a class and a subject first.");
    return;
  }

  if (!schoolCode) {
    setPopup("School code missing. Please login again.");
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
        setPopup(`Recommended Invigilator: ${firstTeacher}`);
      } else {
        setSelectedTeacher('');
        setPopup("No recommendation available.");
      }

    })
    .catch(err => {
      console.error("Error fetching recommendation:", err);
      setPopup("Error fetching recommendation.");
    });
};



  const closeModal = () => {
    setIsModalOpen(false);
  };




    
    // Placeholder for required components (need to be imported or defined)
    const RechartsResponsiveContainer = ({ children, width, height }) => <div style={{ width, height }}>{children}</div>;
  
    const RechartsCartesianGrid = () => null;
    const RechartsXAxis = () => null;
    const RechartsYAxis = () => null;
    const RechartsTooltip = () => null;
    const RechartsLegend = () => null;
    const RechartsBar = () => null;
    const RechartsLine = () => null;

const TestPerformanceBarChart = ({ data }) => {
    const formatYAxis = (value) => `${value.toFixed(0)}%`;










    return (
        // ✨ Size Reduction: Height set to 200
        <ResponsiveContainer width="100%" height={150}>
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



const AcademicLedgerPopup = ({ isOpen, onClose, title, data, headers, loading, subject }) => {
    if (!isOpen) return null;

    // Filter data for selected subject only
    const filteredData = data.filter(row => {
        return subject ? row.subject === subject : true;
    });



    const normalizeHeader = (key) =>
        key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const isDateField = (key) => ['date', 'createdat', 'winning_date', 'created_at'].includes(key.toLowerCase());

    return (
   <div className="staff-academic-ledger-overlay" onClick={onClose}>
    <div className="staff-academic-ledger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="staff-academic-ledger-header">
            <h3 className="staff-academic-ledger-title">{title} Ledger</h3>
            <button
                className="staff-academic-ledger-close-button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close"
            >
                <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>

        {loading ? (
            <p className="staff-academic-ledger-loading-text">Loading detailed report...</p>
        ) : filteredData.length === 0 ? (
            <p className="staff-academic-ledger-no-data-text">
                No data found for subject: {subject}.
            </p>
        ) : (
            <table className="staff-academic-ledger-table">
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>{normalizeHeader(header)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map((header, colIndex) => {
                                let cellValue = row[header] || 'N/A';
                                if (isDateField(header)) {
                                    cellValue = formatDate(cellValue);
                                }
                                return <td key={colIndex}>{cellValue}</td>;
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



const PerformanceLineChart = ({ data }) => {
    const formatXAxis = (tickItem) => {
        const [year, month] = tickItem.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const formatYAxis = (value) => `${value.toFixed(0)}%`;

    return (
        <ResponsiveContainer width="100%" height={150}>
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

  // Fetch ledger data with optional filters
const fetchLedgerData = async (endpoint, title, defaultHeaders, monthYear = null, filters = {}) => {
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

    try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('schoolCode', schoolCode);

        if (monthYear) params.append('month', monthYear);
        if (filters.teacher) params.append('teacher', filters.teacher);
        if (filters.subject) params.append('subject', filters.subject);

        const response = await axios.get(`${API_BASE}/${endpoint}?${params.toString()}`);
        setLedgerData(response.data || []);
    } catch (error) {
        console.error(`Error fetching ${title} ledger data:`, error);
        setLedgerData([]);
    } finally {
        setLedgerLoading(false);
    }
};

// Handle View Report button click
const handleViewReport = (reportName) => {
    const monthYear = selectedMonth;
    addRecentAction("Viewed report", reportName);

    switch (reportName) {
        case "Test Reports":
            fetchLedgerData(
                'all-tests-ledger',
                'Tests',
                ['name', 'class_name', 'subject', 'marks', 'test_type', 'createdAt']
            );
            break;

        case "Low Performance List":
            fetchLedgerData(
                'low-performance-list',
                'Low Performance Students (FA1 < 40)',
                ['name', 'class_name', 'section', 'subject', 'marks']
            );
            break;

        case "High Performance List":
            fetchLedgerData(
                'high-performance-list',
                'High Performance Students (FA1 >= 80)',
                ['name', 'class_name', 'section', 'subject', 'marks']
            );
            break;

        case "Unpunctual Students List":
            fetchLedgerData(
                'unpunctual-students-list',
                `Unpunctual Students (${monthYear})`,
                ['name', 'class', 'section', 'date', 'submission_time'],
                monthYear
            );
            break;

        case "Attendance Track Detail":
            fetchLedgerData(
                'attendance-detail',
                `Attendance Detail (${monthYear})`,
                ['name', 'class', 'section', 'date', 'leavetype', 'submission_time'],
                monthYear
            );
            break;

        case "Generated Reports List":
            fetchLedgerData(
                'generated-reports-list',
                `Generated Progress Reports (${monthYear})`,
                ['name', 'class_name', 'section', 'report', 'comment', 'created_at'],
                monthYear
            );
            break;

        case "SPL Status":
            fetchLedgerData(
                'spl-list',
                'Special Project Leaders (SPL) List',
                ['name', 'class_name', 'section', 'marks']
            );
            break;

        case "Monthly Report Status":
            setPopup(`Viewing report for: ${reportName}\n\nThis will open a detailed ledger report once the corresponding API is implemented.`);
            break;

        case "Test Performance Chart Detail":
        case "Performance Trend Detail":
            // 💡 Only fetch for selected teacher and subject
            if (!leftTeacher || !leftDesignation) {
setPopup({
  message: "Please select a teacher and subject before continuing.",
  type: "error"
});
                return;
            }
            fetchLedgerData(
                'all-tests-ledger',
                `Tests for ${leftTeacher} - ${leftDesignation}`,
                ['name', 'class_name', 'subject', 'marks', 'test_type', 'createdAt'],
                monthYear,
                { teacher: leftTeacher, subject: leftDesignation } // Filter by selected teacher & subject
            );
            break;

        default:
            setPopup(`Viewing report for: ${reportName}`);
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
           // 3. Subjects: Extract unique 'designation' values for the dropdown
let uniqueSubjects = new Set();
teachersData.forEach(teacher => {
    if (teacher.designation) {
        uniqueSubjects.add(teacher.designation.trim());
    }
});

setSubjectsList(Array.from(uniqueSubjects).sort());


        } catch (error) {
            console.error('Error fetching metadata:', error);
        } finally {
            setDropdownLoading(false);
        }
    };


 // ===============================================================
 const ScrollDownIcon = ({ width = 40, height = 60, direction = "down" }) => (
   <svg 
     width={width} 
     height={height} 
     viewBox="0 0 64 96" 
     fill="none" 
     xmlns="http://www.w3.org/2000/svg"
     style={{ transform: direction === "up" ? 'rotate(180deg)' : 'none' }} // Rotate for up direction
   >
     {/* Mouse body */}
     <rect 
       x="12" 
       y="2" 
       width="40" 
       height="60" 
       rx="20" 
       stroke="#0a3d62" 
       strokeWidth="4" 
     />
     {/* Scroll line */}
     <line 
       x1="32" 
       y1="16" 
       x2="32" 
       y2="32" 
       stroke="#0a3d62" 
       strokeWidth="4" 
       strokeLinecap="round"
     />
     {/* Down arrow */}
     <polyline 
       points="24,44 32,52 40,44" 
       fill="none" 
       stroke="#0a3d62" 
       strokeWidth="4" 
       strokeLinecap="round" 
       strokeLinejoin="round"
     />
   </svg>
 );
 
   // SECTION REFS
   const firstSectionRef = useRef(null);
   const secondSectionRef = useRef(null);
   const scrollAreaRef = useRef(null);
 
   // REMOVED: const [secondSectionVisible, setSecondSectionVisible] = useState(false);
   
  // MOBILE RESIZE LISTENER
 useEffect(() => {
   const onResize = () => {
     const isNowMobile = window.innerWidth < 768;
     console.log("📱 RESIZE EVENT: window.innerWidth =", window.innerWidth, "=> isMobile:", isNowMobile);
     setIsMobile(isNowMobile);
   };
 
   window.addEventListener("resize", onResize);
   console.log("✔ Resize listener attached");
 
   return () => {
     window.removeEventListener("resize", onResize);
     console.log("✖ Resize listener removed");
   };
 }, []);
 
 // REMOVED: const secondSectionVisibleRef = useRef(secondSectionVisible);
 // REMOVED: const ignoreScrollHideRef = useRef(false);
 
 // REMOVED: useEffect for scroll-based visibility toggling
 
 const scrollToSecondSection = () => {
   console.log("🔽 scrollToSecondSection called");
 
   requestAnimationFrame(() => {
     if (secondSectionRef.current && scrollAreaRef.current) {
       // Get the position of the second section relative to the scroll container's top
       const offset = secondSectionRef.current.offsetTop; 
       
       console.log("📌 Scrolling to second section at offset:", offset);
       // Scroll the container to that offset
       scrollAreaRef.current.scrollTo({ top: offset, behavior: "smooth" });
     } else {
       console.log("⚠ secondSectionRef.current or scrollAreaRef.current is null");
     }
   });
 };
 
 
 const scrollToTop = () => {
   console.log("🔝 scrollToTop called");
   scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
   console.log("📌 Scrolling container to top");
   // REMOVED: setTimeout logic to hide the second section
 };
 const [leftTeacher, setLeftTeacher] = useState("");
const [rightTeacher, setRightTeacher] = useState("");
// For the left column
const [leftDesignation, setLeftDesignation] = useState("");
const [leftClasses, setLeftClasses] = useState([]);

// For the right column
const [rightDesignation, setRightDesignation] = useState("");
const [rightClasses, setRightClasses] = useState([]);

useEffect(() => {
  if (!leftTeacher) {
    setLeftDesignation("");
    setLeftClasses([]);
    return;
  }
  const teacher = allTeachersMetadata.find(t => t.name === leftTeacher);
  if (!teacher) return;
  setLeftDesignation(teacher.designation);
  const classes = [];
  for (let i = 1; i <= 12; i++) {
    const key = `teaches_to_${i}`;
    if (teacher[key]) {
      classes.push(teacher[key]);
    }
  }
  setLeftClasses(classes);
}, [leftTeacher, allTeachersMetadata]);

useEffect(() => {
  if (!rightTeacher) {
    setRightDesignation("");
    setRightClasses([]);
    return;
  }
  const teacher = allTeachersMetadata.find(t => t.name === rightTeacher);
  if (!teacher) return;
  setRightDesignation(teacher.designation);
  const classes = [];
  for (let i = 1; i <= 12; i++) {
    const key = `teaches_to_${i}`;
    if (teacher[key]) {
      classes.push(teacher[key]);
    }
  }
  setRightClasses(classes);
}, [rightTeacher, allTeachersMetadata]);

const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
const isLargeMonitor = window.innerWidth > 1440;

const [showQuestionPopup, setShowQuestionPopup] = useState(false);

return (
  <div className={`staff-page-container ${compactMode ? "staff-compact-page" : ""} ${isMobile ? "staff-mobile" : isLaptop ? "staff-laptop" : ""}`}>
    {/* ===== HEADER (Outside Scroll) ===== */}
      <div className="footprintsinner">Operations – Academic – Staff</div>


    {/* ===== MAIN CONTENT (SCROLLABLE) ===== */}
    <div className="staff-scroll-area" ref={scrollAreaRef} >
      {/* ===== ROW 1: Charts + Actions ===== */}
<div className="staff-row-container" style={{paddingBottom:'80px', }} ref={firstSectionRef}>
          <div className="track-left-container">

  {/* Test Performance */}
  <div className="staff-test-performance">
<span className='section-header'>Test Performance</span>
    <div className="staff-chart-button-container">
      {/* Chart (left) */}
      <div className="staff-chart">
        {chartLoading
          ? <p>Loading Chart Data...</p>
          : <TestPerformanceBarChart data={testPerformanceData} />
        }
      </div>
      {/* Button (right) */}
      <button
        className="btn-outline"
        onClick={() => handleViewReport("Test Performance Chart Detail")}
      >
        View Report
      </button>
    </div>

    <div className="staff-filters-container">
      {dropdownLoading ? (
        <p className="staff-loading-text">Loading filters...</p>
      ) : (
        <>
          <div className="staff-dropdown-container">
            {/* 🔹 LEFT COLUMN */}
            <div className="staff-dropdown-column">
              {/* Teacher */}
                                <div className="expense-input-field">
                <h2 className="staff-dropdown-label">Low Performers</h2>
                <select
                  className="btn-dropdown-FeesManagement "
                  value={leftTeacher}
                  onChange={(e) => setLeftTeacher(e.target.value)}
                >
                  <option value="">Teachers</option>
                  {teachersList.map((teacher) => (
                    <option key={teacher} value={teacher}>
                      {teacher}
                    </option>
                  ))}
                </select>
              </div>
              {/* Subject */}
              <div>
                <label className="staff-dropdown-label">Subject:</label>
                <span className="staff-dropdown-span">
                  {leftDesignation || " "}
                </span>
              </div>
              <div>
                <label className="staff-dropdown-label">Classes:</label>
                <span className="staff-dropdown-span">
                  {leftClasses.length > 0 ? leftClasses.join(", ") : ""}
                </span>
              </div>
            </div>
            {/* 🔹 RIGHT COLUMN */}
<button
  className="btn-solid"style={{width:'200px', padding:'6px', marginTop:'-7%'}}
  onClick={() =>
    handleReportTeacher({
      teacher: leftTeacher,
      subject: leftDesignation,
      classes: leftClasses,
    })
  }
>
  Report Teacher Performance
</button>
<button
  className="btn-solid"style={{width:'200px', padding:'6px', marginTop:'-7%'}}
  onClick={() =>
    handleComplainAdmin({
      teacher: leftTeacher,
      subject: leftDesignation,
      classes: leftClasses,
      message: "Complaint regarding Test Performance",
    })
  }
>
  Complaint to S.A.
</button>


          </div>
        </>
      )}
    </div>
  </div>

  {/* Performance Graph */}
  <div className="staff-performance-graph" style={{border:'none'}}>
    <span className='section-header'>Performance Graph</span>
    <div className="staff-chart-button-container">
      {/* CHART */}
      <div className="staff-chart">
        {chartLoading ? (
          <p>Loading Chart Data...</p>
        ) : (
          <PerformanceLineChart data={performanceTrendData} />
        )}
      </div>
      {/* BUTTON */}
      <button
        className="btn-outline"
        onClick={() => handleViewReport("Performance Trend Detail")}
      >
        View Report
      </button>
    </div>

    <div className="staff-filters-container">
      {dropdownLoading ? (
        <p className="staff-loading-text">Loading filters...</p>
      ) : (
        <>
          <div className="staff-dropdown-container">
            {/* 🔹 LEFT COLUMN */}
            <div className="staff-dropdown-column">
              {/* Teacher */}
                                <div className="expense-input-field">
                <h2 className="staff-dropdown-label">Low Performers</h2>
                <select
                  className="btn-dropdown-FeesManagement "
                  value={rightTeacher}
                  onChange={(e) => setRightTeacher(e.target.value)}
                >
                  <option value="">Teachers</option>
                  {teachersList.map((teacher) => (
                    <option key={teacher} value={teacher}>
                      {teacher}
                    </option>
                  ))}
                </select>
              </div>
              {/* Subject */}
              <div>
                <label className="staff-dropdown-label">Subject:</label>
                <span className="staff-dropdown-span">
                  {rightDesignation || " "}
                </span>
              </div>
              <div>
                <label className="staff-dropdown-label">Classes:</label>
                <span className="staff-dropdown-span">
                  {rightClasses.length > 0 ? rightClasses.join(", ") : ""}
                </span>
              </div>
            </div>
            {/* 🔹 RIGHT COLUMN */}
<button
  className="btn-solid"style={{width:'200px', padding:'6px', marginTop:'-7%'}}
  onClick={() =>
    handleReportTeacher({
      teacher: rightTeacher,
      subject: rightDesignation,
      classes: rightClasses,
    })
  }
>
  Report Teacher Performance
</button>
<button
  className="btn-solid"style={{width:'200px', padding:'6px', marginTop:'-7%'}}
  onClick={() =>
    handleComplainAdmin({
      teacher: rightTeacher,
      subject: rightDesignation,
      classes: rightClasses,
      message: "Complaint regarding Performance Trend",
    })
  }
>
  Complaint to S.A.
</button>

          </div>
        </>
      )}
    </div>
  </div>
</div>

<div className="Card-rightContainer" >
<h3 className="section-header">
  Actions ({pendingClasses.length + submittedClasses.length + (complaints?.length || 0)})
</h3>
  {/* RECENT ACTIONS (RETRIEVED FROM YOUR ACTIVITY) */}
  <div className="staff-action-item" style={{ display: "block" }}>
    <div className="staff-action-header">Recent Actions ({recentActions.length})</div>
    <div style={{ maxHeight: "150px", overflowY: "auto", display: "grid", gap: "6px" }}>
      {recentActions.length === 0 ? (
        <div style={{ fontSize: "12px", color: "#666" }}>No recent actions yet</div>
      ) : (
        recentActions.map((a) => (
          <div key={a.id} style={{ border: "1px solid #e6e6e6", borderRadius: "6px", padding: "6px", background: "#fafafa" }}>
            <div style={{ fontSize: "12px", fontWeight: 600 }}>{a.title}</div>
            <div style={{ fontSize: "11px", color: "#555" }}>{a.detail}</div>
            <div style={{ fontSize: "10px", color: "#999" }}>{new Date(a.createdAt).toLocaleString()}</div>
          </div>
        ))
      )}
    </div>
  </div>

  {/* CLASS ACTIONS */}
  {[...pendingClasses.map(c => ({ ...c, status: 'Pending', type: 'class' })),
    ...submittedClasses.map(c => ({ ...c, status: 'Submitted', type: 'class' }))]

    .filter(cls => !dismissedClasses.includes(`${cls.class_name}-${cls.section}`))
    .map((cls, idx) => (
      <div key={`class-${idx}`} className="staff-action-item">
        <div className="staff-action-header">
          Scan & Pull
        </div>
        <div className="staff-action-content">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* arrow icon added as per user request */}
            <FontAwesomeIcon icon={faArrowRight} className="staff-action-arrow" />
            Class {cls.class_name} Section {cls.section} <span>{cls.status}</span>
          </div>
          <button
            className="staff-ok-btn"
            onClick={() => {
              const classKey = `${cls.class_name}-${cls.section}`;
              const newDismissed = [...dismissedClasses, classKey];
              setDismissedClasses(newDismissed);
              localStorage.setItem("dismissedClasses", JSON.stringify(newDismissed));
              addRecentAction("Scan & Pull closed", `Class ${cls.class_name} Section ${cls.section} marked OK`);
            }}
          >
            OK
          </button>
        </div>
      </div>
    ))}

  {/* 🔔 COMPLAINTS & REPORTS DISPLAY */}
  {complaints.map((c, idx) => (
    <div key={`complaint-${idx}`} className="staff-action-item" >
      <div className="staff-action-header">
        {c.type === "teacher_report" ? "Teacher Report" : "Admin Complaint"}
      </div>
      <div className="staff-action-content">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FontAwesomeIcon icon={faArrowRight} className="staff-action-arrow" />
          {c.teacher ? `Teacher: ${c.teacher}` : "General Complaint"}
          <span style={{ fontSize: "11px", color: "#999", marginLeft: "6px" }}>
            {new Date(c.created_at).toLocaleDateString()}
          </span>
        </div>
        <button
          className="staff-ok-btn"
          style={{ background: "#5a7488" }}
          onClick={() => openComplaintModal(c)}
        >
          View
        </button>
      </div>
    </div>
  ))}
</div>
{selectedComplaint && (
  <div className="staff-modal-overlay" onClick={closeComplaintModal}>
    <div className="staff-modal-box" onClick={(e) => e.stopPropagation()}>
      <h3 style={{ marginBottom: "8px" }}>
        {selectedComplaint.type === "teacher_report" ? "Teacher Report" : "Admin Complaint"}
      </h3>
      <p style={{ margin: "4px 0", fontSize: "13px" }}>
        <strong>Teacher:</strong> {selectedComplaint.teacher || "-"}
      </p>
      <p style={{ margin: "4px 0", fontSize: "13px" }}>
        <strong>Subject:</strong> {selectedComplaint.subject || "-"}
      </p>
      <p style={{ margin: "4px 0", fontSize: "13px" }}>
        <strong>Classes:</strong>{" "}
        {Array.isArray(selectedComplaint.classes)
          ? selectedComplaint.classes.join(", ")
          : selectedComplaint.classes || "-"}
      </p>
      <p style={{ margin: "8px 0", fontSize: "13px", whiteSpace: "pre-wrap" }}>
        <strong>Message:</strong> {selectedComplaint.message || "-"}
      </p>
      <button className="btn-solid" onClick={closeComplaintModal}>Close</button>
    </div>
  </div>
)}


</div>
  

   

        {/* ===== ROW 2: Question Paper Generator + Assign ===== */}
       {/* repeat header at start of second scrollable section so it's visible when
            the user has scrolled past the first section */}
       <div className="footprintsinner" style={{ marginTop: '10px' }}>
         Operations – Academic – Staff
       </div>
       <div className="staff-row-container" style={{paddingBottom:'80px', }} ref={secondSectionRef}>
  {/* LEFT CONTAINER: QP, Invigilator, Scan & Pull */}
  <div className="track-left-container" >
    {/* Question Paper Generator */}
<div className="staff-qp-section">
  {/* ===== QUESTION PAPER GENERATOR (TOP) ===== */}
  <div className="staff-qp-top">
    <h1 className="staff-qp-header">
<div className="staff-qp-item">
  <span className="staff-qp-circle" style={{ backgroundColor: '#D4C7B0' }} />
  <span className="section-header">Question Paper Generator</span>
</div>
    </h1>
    {error && <p className="staff-error">{error}</p>}

    <div className="staff-qp-row">
                                      <div className="expense-input-field">

      {/* --- Class / Subject / Exam --- */}
        <select onChange={handleClassChange} className="btn-dropdown-FeesManagement ">
          <option value="">Class</option>
          <option value="0">Nursery</option>
          <option value="LKG">LKG</option>
          <option value="UKG">UKG</option>
          {[...Array(10).keys()].map((i) => (
            <option key={i + 1} value={i + 1}>
              Class {i + 1}
            </option>
          ))}
        </select>
</div>
                                      <div className="expense-input-field">

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="btn-dropdown-FeesManagement "
        >
          <option value="">Subject</option>
          {subjects.map((subject, idx) => (
            <option key={idx} value={subject}>
              {subject}
            </option>
          ))}
        </select>
</div>
                                      <div className="expense-input-field">

        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className="btn-dropdown-FeesManagement "
        >
          <option value="">Exam</option>
          <option>Mid</option>
          <option>Term</option>
          <option>Quarterly</option>
          <option>Half-Yearly</option>
          <option>Annual</option>
        </select>
</div>
                                      <div className="expense-input-field">

      {/* --- Chapter & Topics --- */}
        <select
          value={chapterCode}
          onChange={(e) => setChapterCode(e.target.value)}
          className="btn-dropdown-FeesManagement "
        >
          <option value="">Select Chapter</option>
          {chapterMapping.map((ch) => (
            <option key={ch.code} value={ch.code}>
              {ch.label}
            </option>
          ))}
        </select>
        </div>
                                              <div className="expense-input-field">

        <button
          onClick={fetchSyllabusTopics}
          className="btn-dropdown-FeesManagement-admin " style={{marginTop:'-3px'}}
          disabled={!chapterCode || loading}
          
        >
          {loading ? "Reading PDF..." : "Load Sub-topics"}
        </button>
  </div>

      {/* --- Sub-topics Multi-select --- */}
      {extractedTopics.length > 0 && (
        <select
          multiple
          value={selectedTopics}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions, (opt) => opt.value);
            setSelectedTopics(options);
          }}
          className="btn-dropdown-FeesManagement-admin  staff-qp-multi-select"
        >
          {extractedTopics.map((topic) => (
            <option key={topic.id} value={topic.title}>
              {topic.id} - {topic.title}
            </option>
          ))}
        </select>
      )}

      {/* --- Question Type Counts --- */}
      <div className="staff-qp-question-type">
        {["Short Answer", "Long Answer", "MCQ"].map((type) => (
          <div key={type} className="staff-qp-question-type-column">
            <span>{type}s:</span>
                                                  <div className="expense-input-field">

            <select
              value={questionCounts[type]}
              onChange={(e) =>
                setQuestionCounts({
                  ...questionCounts,
                  [type]: parseInt(e.target.value),
                })
              }
              className="btn-dropdown-FeesManagement "
            >
              {[...Array(11)].map((_, idx) => (
                <option key={idx} value={idx}>
                  {idx}
                </option>
              ))}
            </select></div>
          </div>
        ))}
      </div>

      {/* --- Generate Button --- */}
      <button
        onClick={handleGenerate}
        className="btn-solid"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>

    {/* Generated Question Paper Modal */}
    {showQuestionPopup && (
      <div className="staff-modal-overlay" onClick={() => setShowQuestionPopup(false)}>
        <div className="staff-modal-box" onClick={(e) => e.stopPropagation()}>
          <h3 className="staff-modal-title">Generated Question Paper</h3>
          {["Short Answer", "Long Answer", "MCQ"].map((type) => {
            const questionsOfType = questionPaper.filter(
              (q) => q.question_type === type
            );
            if (!questionsOfType.length) return null;
            return (
              <div key={type}>
                <h4>{type}</h4>
                <ul className="staff-modal-list">
                  {questionsOfType.map((q, idx) => (
                    <li key={idx} className="staff-modal-list-item">
                      <strong>{q.question_no}.</strong> {q.question_text} ({q.marks} marks)
                      {type === "MCQ" && q.options && (
                        <div className="staff-modal-mcq-options">
                          {q.options.map((opt, i) => (
                            <div key={i}>
                              <strong>({String.fromCharCode(97 + i)})</strong> {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div className="staff-modal-download-btn">
            <button onClick={handleDownloadPDF} className="staff-modal-download-btn">
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* ===== SCAN & PULL (LEFT) AND INVIGILATOR (RIGHT) ===== */}
  <div className="staff-scan-invigilator-container">
    {/* Scan & Pull (LEFT) */}
    <div className="staff-scan-pull">
      <h2 className="staff-card-header">
        <span className="section-header"> Scan & Pull</span>
      </h2>
      <div className="staff-card-content">
                                              <div className="expense-input-field">

          <select className="btn-dropdown-FeesManagement ">
            <option value="">Pending</option>
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
          </select></div>                                      <div className="expense-input-field">

          <select className="btn-dropdown-FeesManagement ">
            <option value="">Remind</option>
            <option value="SMS">Send SMS Reminder</option>
            <option value="Email">Send Email</option>
            <option value="Call">Call Parent</option>
          </select></div>
      </div>
    </div>

    {/* Invigilator (RIGHT) */}
    <div className="staff-invigilator">
      <h2 className="staff-card-header">
        <span className="section-header"  > Invigilator</span>
      </h2>
      <div className="staff-card-dropdown-group">
                                              <div className="expense-input-field">

        <select
          className="btn-dropdown-FeesManagement "
          value={selectedClassInvigilator}
          onChange={(e) => setSelectedClassInvigilator(e.target.value)}
        >
          <option value="">Select Class</option>
          {classes.map((cls, index) => (
            <option key={index} value={cls}>
              {cls}
            </option>
          ))}
        </select></div>
                                      <div className="expense-input-field">

  <select
  className="btn-dropdown-FeesManagement"
  value={selectedSubjectInvigilator}
  onChange={(e) => setSelectedSubjectInvigilator(e.target.value)}
>
  <option value="">Select Subject</option>
  {subjectsList?.map((sub, idx) => (
    <option key={idx} value={sub}>
      {sub}
    </option>
  ))}
</select>

</div>                                      <div className="expense-input-field">

        <select
          className="btn-dropdown-FeesManagement "
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">Select Teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select></div>
      </div>
      <div className="staff-card-button-group">
        <button className="btn-outline" onClick={handleAssign}>
          Assign
        </button>
        <button className="btn-outline" onClick={handleRecommendation}>
          Recommend
        </button>
      </div>
    </div>
  </div>

  {/* Modal for Invigilator */}
  {isModalOpen && (
    <div className="staff-modal-overlay">
      <div className="staff-modal-box">
        <h3>{modalMessage}</h3>
        <button className="btn-solid" onClick={closeModal}>
          OK
        </button>
      </div>
    </div>
  )}
</div>

    {/* Modal for Invigilator */}
    {isModalOpen && (
      <div className="staff-modal-overlay">
        <div className="staff-modal-box">
          <h3>{modalMessage}</h3>
          <button className="btn-solid" onClick={closeModal}>
            OK
          </button>
        </div>
      </div>
    )}
  </div>

  {/* RIGHT CONTAINER: Assign Student Role & Assign Staff */}
 <div className="Card-rightContainer">
  <div className="assign-wrapper">

    {/* LEFT SIDE */}
    <div className="assign-left">
      <h2 className="section-header">Assign Student</h2>

      <div className="staff-card-dropdown-group">
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement">
            <option>Select Student</option>
            {studentsList?.map((s, idx) => (
              <option key={idx} value={s.user_id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement">
            <option>Select Class</option>
            {classList?.map((c, idx) => (
              <option key={idx}>{c.class_name} {c.section}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="staff-card-dropdown-group">
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement">
            <option>Select Position</option>
            <option>Leader</option>
            <option>Assistant</option>
            <option>Monitor</option>
          </select>
        </div>

        <button   className="btn-solid assign-student-btn"
style={{marginTop:'-2%'}} onClick={handleAssignStudent}>
          Assign Student
        </button>
      </div>
    </div>


    {/* RIGHT SIDE */}
    <div className="assign-right">
      <h2 className="section-header">Assign Student Role</h2>

      <div className="staff-card-dropdown-group">
        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement">
            <option>Select Teacher</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="expense-input-field">
          <select className="btn-dropdown-FeesManagement">
            <option>Select Subject</option>
            {subjectsList?.map((sub, idx) => (
              <option key={idx} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      <button className="btn-solid" onClick={handleAssignTeacher}>
        Assign
      </button>
    </div>

  </div>
</div>
</div>

{/* Scroll Up Button */}
{/* <div className="staff-scroll-btn-container">
  <button className="staff-scroll-btn" onClick={scrollToTop}>
    <ScrollDownIcon width={30} height={50} direction="up" />
  </button>
</div> */}


      {/* Academic Ledger Popup */}
      <AcademicLedgerPopup
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        title={ledgerTitle}
        data={ledgerData}
        headers={ledgerHeaders}
        loading={ledgerLoading}
        subject={leftDesignation}
      />
  
  </div>
  
  <ErrorPopup
  message={popup.message}
  type={popup.type}
  onClose={() => setPopup({ message: "", type: "" })}
/>

  </div>
);

};

export default ExamDashboard;