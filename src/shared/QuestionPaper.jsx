
import axios from 'axios';
import jsPDF from 'jspdf';
import React, { useState,useRef,useContext } from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';

const schoolLogo = ""; // Optional custom logo
// import './Questionpaper.css';

function QuestionPaperGenerator() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState([]);
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
  const [board, setBoard] = useState(''); // New state for board selection

  const typeLabels = {
    'Short Answer': 'I. Short Answer Questions',
    'Long Answer': 'II. Long Answer Questions',
    'MCQ': 'III. Multiple Choice Questions',
  };
  const logoSrc = schoolLogo || "/default-logo.png";
  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const navigate = useNavigate();
  const [showAttendance, setShowAttendance] = useState(false);

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

  useEffect(() => {
    setLoading(true);
    axios.get('https://cleezoclass.com/:3010/api/clases')
      .then(response => {
        setClasses(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error fetching classes');
        setLoading(false);
      });
  }, []);

  const handleClassChange = (event) => {
    const classLevel = event.target.value;
    setSelectedClass(classLevel);
    setSubjects([]);
    setSelectedSubject('');
    setQuestionPaper([]);
    setTotalMarks(0);
    setSource('');

    if (classLevel && board) {
      setLoading(true);
      axios.get(`https://cleezoclass.com/:3010/api/subjects/${classLevel}/${board}`) // Pass board as parameter
        .then(response => {
          setSubjects(response.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Error fetching subjects');
          setLoading(false);
        });
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
      axios.get(`https://cleezoclass.com/:3010/api/subjects/${selectedClass}/${selectedBoard}`)
        .then(response => {
          setSubjects(response.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Error fetching subjects');
          setLoading(false);
        });
    }
  };

  const handleQuestionCountChange = (type, value) => {
    setQuestionCounts(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
  };

  const handleGenerateQuestionPaper = () => {
    if (!selectedClass || !selectedSubject || !examType || !board) {
      alert('Please select all fields');
      return;
    }

    const selectedQuestionCounts = {
      'Short Answer': questionCounts['Short Answer'],
      'Long Answer': questionCounts['Long Answer'],
      'MCQ': questionCounts['MCQ'],
    };

    setLoading(true);
    setError('');
    axios.post('https://cleezoclass.com/:3010/api/Questionpaper', {
      class: selectedClass,
      subject: selectedSubject,
      examType,
      selectedQuestionCounts,
      board, // Include board in the request
    })
      .then(response => {
        setQuestionPaper(response.data.questions);
        setTotalMarks(response.data.totalMarks);
        setSource(response.data.source);
        setLoading(false);
      })
      .catch(() => {
        setError('Error generating question paper');
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
      const questions = questionPaper.filter(q => q.question_type === type);
      if (questions.length === 0) return;

      doc.setFontSize(13);
      doc.text(typeLabels[type], 10, yOffset);
      yOffset += 10;

      questions.forEach((q) => {
        doc.setFontSize(12);
        const questionLines = doc.splitTextToSize(`Q${q.question_no}: ${q.question_text}`, 180);
        questionLines.forEach(line => {
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
  const handleBackClick = () => {
    navigate('/accdemic'); // Navigate to the "accdemic" route
  };

  return (
     <>
        <header className="top-bar">
          <div className="left-section">School Logo</div>
        </header>
    
        <div className="outer-container">
          <aside className="sidebar">
            <div className="logo"></div>
            <nav className="nav-icons">
              <i className="fa fa-cogs" title="Operations"></i>
              <i className="fa fa-bullhorn" title="Marketing"></i>
              <i className="fa fa-shopping-cart" title="Commerce"></i>
              <i className="fa fa-wrench" title="Services"></i>
              <i className="fa fa-headphones" title="Support"></i>
              <i className="fa fa-cog" title="Settings"></i>
            </nav>
          </aside>
    
          <div className="main-content">
            <div className="header">
              <div className="header-left">
              <button className="btn-back" onClick={handleBackClick}>
      <ArrowLeft size={18} />
    </button>
    
              </div>
              <div className="header-right">
              <button className="btn-share" onClick={handleShare}>
    <Share size={18} />
    Share
    </button>
    
                <button className="btn-download" onClick={handleDownload}>
                  <Download size={18} />
                  Download
                </button>
              </div>
            </div>
    <div>
    <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Question Paper Generation</h1>
  
    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
  
    <div className="dropdown-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
      <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Select Board:
        <select value={board} onChange={handleBoardChange} style={selectStyle}>
          <option value="">Select Board</option>
          <option value="SSC">SSC</option>
          <option value="CBSE">CBSE</option>
        </select>
      </label>
  
      <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Select Class:
        <select onChange={handleClassChange} style={selectStyle}>
          <option value="">Select Class</option>
          <option value="0">Nursery</option>
          <option value="LKG">LKG</option>
          <option value="UKG">UKG</option>
          {[...Array(10).keys()].map(i => (
            <option key={i + 1} value={i + 1}>Class {i + 1}</option>
          ))}
        </select>
      </label>
  
      <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Select Subject:
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={selectStyle}>
          <option value="">--Select--</option>
          {subjects.map((subject, index) => (
            <option key={index} value={subject}>{subject}</option>
          ))}
        </select>
      </label>
  
      <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Select Exam Type:
        <select value={examType} onChange={(e) => setExamType(e.target.value)} style={selectStyle}>
          <option value="">--Select--</option>
          <option>Mid</option>
          <option>Term</option>
          <option>Quarterly</option>
          <option>Half-Yearly</option>
          <option>Annual</option>
        </select>
      </label>
    </div>
  
    {questionPaper.length > 0 && (
      <div className="generated-paper" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Generated Question Paper</h3>
        <p><strong>Subject:</strong> {selectedSubject}</p>
        <p><strong>Exam Type:</strong> {examType}</p>
        <p><strong>Total Marks:</strong> {totalMarks}</p>
        <p><strong>Source:</strong> {source}</p>
  
        {['Short Answer', 'Long Answer', 'MCQ'].map((type) => {
          const questionsOfType = questionPaper.filter(q => q.question_type === type);
          if (questionsOfType.length === 0) return null;
  
          return (
            <div className="section-box" key={type} style={sectionBoxStyle}>
              <div className="section-header" style={sectionHeaderStyle}>{typeLabels[type]}</div>
              <ul className="question-list" style={questionListStyle}>
                {questionsOfType.map((q, idx) => (
                  <li className="question-item" key={idx} style={questionItemStyle}>
                    <div>
                      <strong>{q.question_no}.</strong> {q.question_text}
                      <span style={{ float: 'right', marginLeft: '100px' }}>
                        ({q.marks} marks)
                      </span>
                    </div>
                    {type === 'MCQ' && Array.isArray(q.options) && q.options.length > 0 && (
                      <ul style={optionsListStyle}>
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
  
        <div style={buttonContainerStyle}>
          <button onClick={handleDownloadPDF} style={buttonStyle}>Download PDF</button>
        </div>
      </div>
    )}
  
    <br />
    <div style={buttonWrapperStyle}>
      <button
        onClick={handleGenerateQuestionPaper}
        disabled={loading}
        style={{ ...buttonStyle, backgroundColor: loading ? '#cccccc' : '#4CAF50', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </div>
  </div>
  </div></div></>
   );
  }
  const selectStyle = {
    padding: '8px',
    fontSize: '16px',
    width: '200px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginTop: '8px',
  };
  
  const sectionBoxStyle = {
    marginBottom: '20px',
  };
  
  const sectionHeaderStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
    backgroundColor: '#f1f1f1',
    padding: '10px',
    borderRadius: '5px',
  };
  
  const questionListStyle = {
    listStyleType: 'none',
    paddingLeft: '15px',
  };
  
  const questionItemStyle = {
    marginBottom: '20px',
  };
  
  const optionsListStyle = {
    listStyleType: 'none',
    paddingLeft: '15px',
    marginTop: '5px',
  };
  
  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
  };
  
  const buttonWrapperStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
  
  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };
  
 

export default QuestionPaperGenerator;
