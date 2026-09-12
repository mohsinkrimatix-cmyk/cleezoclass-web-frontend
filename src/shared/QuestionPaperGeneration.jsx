
import axios from 'axios';
import jsPDF from 'jspdf';
import React, { useState,useRef,useContext,useEffect } from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle,BookOpen } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

const schoolLogo = ""; // Optional custom logo
// import './Questionpaper.css';

function QuestionPaperGenerator() {
    const location = useLocation();

const queryParams = new URLSearchParams(location.search);
const studentName = queryParams.get("studentName");
const studentClass = queryParams.get("studentClass");
const schoolCode = queryParams.get("schoolCode"); // ✅ Get it from URL instead of localStorage

console.log("Query Params:", location.search);
console.log("Student Name:", studentName);
console.log("Student Class:", studentClass);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [questionCounts, setQuestionCounts] = useState({
    'Short Answer': 0,
    'Long Answer': 0,
    'MCQ': '',
  });
  const [questionPaper, setQuestionPaper] = useState([]);
  const [totalMarks, setTotalMarks] = useState(0);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [board, setBoard] = useState('SSC');

  const typeLabels = {
    'Short Answer': 'I. Short Answer Questions',
    'Long Answer': 'II. Long Answer Questions',
    'MCQ': 'III. Multiple Choice Questions',
  };

 const [rating, setRating] = useState("");
const [remarks, setRemarks] = useState("");
const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);


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
    // → "7th maths"

    const subjectUpper = selectedSubject.toUpperCase();
    // → "MATH"

    console.log("FINAL SUBJECT:", subjectUpper);
    console.log("FINAL GRADE:", formattedGrade);

    const res = await axios.get(
      "https://cleezoclass.com:4000/api/extract-topics",
      {
        params: {
          subject: subjectUpper, // ✅ UPPERCASE
          grade: formattedGrade, // ✅ lowercase maths
          fileCode: chapterCode,
        },
      }
    );

    setExtractedTopics(res.data.subTopics || []);
  } catch (err) {
    console.error(err);
    alert("Error reading PDF syllabus");
  }
  setLoading(false);
};

const [marks, setMarks] = useState("");
const [studentEmail, setStudentEmail] = useState("");


const handleSubmitFeedback = async () => {
  try {

    const res = await axios.post(
      "https://cleezoclass.com:4000/api/api/submit-feedback",
      {
        user_name: studentName,
        student_class: studentClass, // ✅ CLASS instead of email
        message: remarks,
        rating,
        marks,
        schoolCode,
      }
    );

    if (res.data.success) {
      alert(res.data.message);
      setRating("");
      setRemarks("");
      setMarks("");
    }
  } catch (err) {
    alert("Failed to submit feedback");
  }
};






  // The container click handler to update active content
  const handleContainerClick = (content) => {
    setActiveContent(content); // Update active content
  };
const handleGenerate = async () => {
  if (selectedTopics.length === 0) {
    alert("Please select at least one sub-topic.");
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
  schoolCode, // ✅ pass here
    });
    
    setQuestionPaper(response.data.questions);
    setShowQuestionPopup(true);
  } catch (error) {
    alert("Error generating paper from selected topics");
  }
  setLoading(false);
};


useEffect(() => {

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
        (prev ? prev + ' |     ' : '    ')
      )
    )
    .finally(() => setLoading(false));

}, []);
  const handleClassChange = (event) => {
    const classLevel = event.target.value;
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


  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  

  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
const isLargeMonitor = window.innerWidth > 1440;
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

  const styles = {
    pageContainer: {
      display: 'flex',
      flexDirection: 'column',
      // FIX 1: Changed '50vh' to '100vh' for the main viewport container to allow full screen scrolling
          padding: "0",
          
                backgroundColor: 'transparent',
               

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
      backgroundColor: "transparent",
      borderRadius: "16px",
      overflow: 'hidden', 
      padding: "0",
        flexDirection:'column'   ,
        overflowY: 'auto' // Crucial for scrolling
    },
    leftContainer: {
      // FIX: Changed fixed 76vw to a flexible 70vw to allow more space for the right container
      flex: '0 0 50vw', 
      padding: '20px',
      overflowY: 'auto', 
      
      display: 'flex',
      flexDirection: 'column',
            width:'50vw',

 /* Custom scrollbar */
  scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
    },
    rightContainer: {
      flex: 1, // Takes remaining space (approx 30vw)
      padding: '20px',
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto', // FIX: Allows the entire right container to scroll
      overflowX: 'hidden', // Prevent horizontal scroll
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
      fontSize: "18px",
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
      fontSize: '18px',
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
      width: 'auto',
    },
    select: {
      padding: '8px',
      borderRadius: '16px',
      border: 'none',
      marginTop: '5px',
      backgroundColor: '#6b7983ff',
      color: '#fff',
      width: '100%',
      maxWidth: '120px',
      minWidth: '120px',

    
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
      border: '1px solid #ccc',
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
    Button: {
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
      padding: '10px',
      borderRadius: '12px',
      backgroundColor: 'transparent',
      transition: 'box-shadow 0.3s ease',
      width:'30vw',
      marginTop: '5px'
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
  return (
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "100vh",
    padding: "20px",
    background: "#f0f2f5",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  }}
>
  <div
    style={{
      width: "100%",
      maxWidth: "1000px",
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    }}
  >
    {/* HEADER */}
    <h1 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "24px", color: "#333" }}>
      <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#D4C7B0" }} />
      Question Paper 
    </h1>
    {error && <p style={{ color: "red" }}>{error}</p>}

    {/* SINGLE ROW CONTROLS */}
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "10px",
      }}
    >
                                      <div className="expense-input-field">

      <select onChange={handleClassChange} className="btn-dropdown-FeesManagement">
        <option value="">Class</option>
        <option value="0">Nursery</option>
        <option value="LKG">LKG</option>
        <option value="UKG">UKG</option>
        {[...Array(10).keys()].map((i) => (
          <option key={i + 1} value={i + 1}>
            Class {i + 1}
          </option>
        ))}
      </select></div>
                                      <div className="expense-input-field">


      <select
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
        className="btn-dropdown-FeesManagement"
      >
        <option value="">Subject</option>
        {subjects.map((subject, idx) => (
          <option key={idx} value={subject}>
            {subject}
          </option>
        ))}
      </select></div>

      <div style={{ display: "flex", gap: "5px" }}>
                                        <div className="expense-input-field">

        <select
          value={chapterCode}
          onChange={(e) => setChapterCode(e.target.value)}
          className="btn-dropdown-FeesManagement"
          styles={{ padding: "0" }}
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
          className="btn-dropdown-FeesManagement"
                              style={{ marginTop: "-20px" , padding:'0'}}

          disabled={!chapterCode || loading}

        >
          {loading ? "Reading PDF..." : "Load Sub-topics"}
        </button></div>
      </div>

      {extractedTopics.length > 0 && (
        <select
          multiple
          value={selectedTopics}
          onChange={(e) => setSelectedTopics(Array.from(e.target.selectedOptions, (opt) => opt.value))}
          className="btn-dropdown-FeesManagement"
          style={{ minWidth: "200px", height: "50px" }}
        >
          {extractedTopics.map((topic) => (
            <option key={topic.id} value={topic.title}>
              {topic.id} - {topic.title}
            </option>
          ))}
        </select>
      )}

      {/* Question Count */}
      {["MCQ"].map((type) => (
        <div key={type} style={{ display: "flex", flexDirection: "column", alignItems: "center" ,marginTop:'-17px'}}>
          <span style={{ fontSize: "12px" , }}>{type}:</span>
          <select
            value={questionCounts[type]}
            onChange={(e) => setQuestionCounts({ ...questionCounts, [type]: parseInt(e.target.value) })}
            className="btn-dropdown-FeesManagement"
          >
            {[...Array(11)].map((_, idx) => (
              <option key={idx} value={idx}>
                {idx}
              </option>
            ))}
          </select>
        </div>
      ))}

      <button
        onClick={handleGenerate}
        className="btn-outline"
        disabled={loading}
        style={{ height: "40px", whiteSpace: "nowrap" , marginTop:'-10px'}}
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>

    {/* Generated Question Paper Popup */}
    {showQuestionPopup && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          padding: "20px",
        }}
        onClick={() => setShowQuestionPopup(false)}
      >
        <div
          style={{
            width: "90%",
            maxWidth: "1000px",
            maxHeight: "85vh",
            overflowY: "auto",
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "left",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ textAlign: "center", marginBottom: "10px" }}>Generated Question Paper</h3>
          {["MCQ"].map((type) => {
            const questionsOfType = questionPaper.filter((q) => q.question_type === type);
            if (!questionsOfType.length) return null;

            return (
              <div key={type}>
                <h4>{type}</h4>
                <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                  {questionsOfType.map((q, idx) => (
                    <li key={idx} style={{ marginBottom: "10px" }}>
                      <strong>{q.question_no}.</strong> {q.question_text} ({q.marks} marks)
                      {type === "MCQ" && q.options && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                            marginLeft: "20px",
                            marginTop: "5px",
                          }}
                        >
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
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button onClick={handleDownloadPDF} style={styles.Button}>
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Feedback Section */}
 <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  {/* Rating */}
  <div style={{ display: "flex", flexDirection: "column" }}>
    <label>Rating</label>
    <select
      value={rating}
      onChange={(e) => setRating(e.target.value)}
      className="btn-dropdown-FeesManagement"
      style={{ minWidth: "120px" }}
    >
      <option value="">Select</option>
      <option value="1">1 - Poor</option>
      <option value="2">2 - Fair</option>
      <option value="3">3 - Good</option>
      <option value="4">4 - Very Good</option>
      <option value="5">5 - Excellent</option>
    </select>
  </div>

  {/* Marks */}
  <div style={{ display: "flex", flexDirection: "column" }}>
    <label>Marks</label>
    <input
      type="number"
      value={marks}
      onChange={(e) => setMarks(e.target.value)}
      className="btn-dropdown-FeesManagement"
      placeholder="Enter marks"
      style={{ minWidth: "80px" }}
    />
  </div>

  {/* Remarks */}
  <div style={{ display: "flex", flexDirection: "column" }}>
    <label>Remarks</label>
    <textarea
      rows="1"
      value={remarks}
      onChange={(e) => setRemarks(e.target.value)}
      className="btn-dropdown-FeesManagement"
    />
  </div>

  {/* Submit Button */}
  <div style={{ display: "flex", flexDirection: "column" }}>
    <label style={{ visibility: "hidden" }}>.</label>
    <button
      onClick={handleSubmitFeedback}
      disabled={!rating || !remarks || !marks} // ✅ include marks
      style={{
        
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
           className='btn-solid'

    >
      Submit Feedback
    </button>
  </div>
</div>

  </div>
</div>

   );
  }


export default QuestionPaperGenerator;