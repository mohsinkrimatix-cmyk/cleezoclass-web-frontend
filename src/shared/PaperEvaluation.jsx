import { useRef, useState ,useEffect} from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const schoolLogo = ""; // Optional custom logo

function PDFEvaluator() {
  const [questionPDF, setQuestionPDF] = useState(null);
  const [answerPDF, setAnswerPDF] = useState(null);
  const [studentPDF, setStudentPDF] = useState(null);
  const [error, setError] = useState('');
  const [score, setScore] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');

  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [section, setSection] = useState('');
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


  const encodeFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  const handleBackClick = () => {
    navigate('/accdemic'); // Navigate to the "accdemic" route
  };
  const handleEvaluate = async (e) => {
    e.preventDefault();
    setError('');
    setScore(null);
    setResults([]);
    setLoading(true);

    try {
      if (!questionPDF || !answerPDF || !studentPDF || !subject || !studentName || !studentClass || !section) {
        setError('Please upload all required PDFs and fill all student details.');
        setLoading(false);
        return;
      }

      const [questionPdfBase64, answerPdfBase64, studentPdfBase64] = await Promise.all([
        encodeFileToBase64(questionPDF),
        encodeFileToBase64(answerPDF),
        encodeFileToBase64(studentPDF)
      ]);

      const res = await axios.post('https://cleezoclass.com/:3010/api/evaluate', {
        question_pdf_base64: questionPdfBase64,
        answer_pdf_base64: answerPdfBase64,
        student_pdf_base64: studentPdfBase64,
        student_name: studentName,
        student_class: studentClass,
        section: section,
        subject: subject,
      });

      setScore(res.data.score);
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing the PDFs. Please try again.');
    } finally {
      setLoading(false);
    }
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f4f4f9',
      padding: '20px',
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '20px',
        textAlign: 'center'
      }}>Evaluate Student Question Paper with Answer Papers</h2>

      <form onSubmit={handleEvaluate} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '600px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      }}>

        {/* Student Details */}
        <div style={{ marginBottom: '15px', width: '100%' }}>
          <label htmlFor="studentName" style={{ fontSize: '14px', color: '#555' }}>Student Name:</label>
          <input
            type="text"
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px', width: '100%' }}>
          <label htmlFor="studentClass" style={{ fontSize: '14px', color: '#555' }}>Class:</label>
          <input
            type="text"
            id="studentClass"
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px', width: '100%' }}>
          <label htmlFor="section" style={{ fontSize: '14px', color: '#555' }}>Section:</label>
          <input
            type="text"
            id="section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
        </div>

        {/* File Inputs */}
        {['Question', 'Answer Key', 'Student Answer'].map((label, index) => {
          const setter = [setQuestionPDF, setAnswerPDF, setStudentPDF][index];
          const id = ['question_pdf', 'answer_pdf', 'student_pdf'][index];
          return (
            <div key={id} style={{ marginBottom: '15px', width: '100%' }}>
              <label htmlFor={id} style={{ fontSize: '14px', color: '#555' }}>{label} PDF:</label>
              <input
                type="file"
                id={id}
                accept="application/pdf"
                onChange={(e) => setter(e.target.files[0])}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              />
            </div>
          );
        })}

        {/* Subject Dropdown */}
        <div style={{ marginBottom: '15px', width: '100%' }}>
          <label htmlFor="subject" style={{ fontSize: '14px', color: '#555' }}>Select Subject:</label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          >
            <option value="">Select Subject</option>
            <option value="Telugu">Telugu</option>
            <option value="English">English</option>
            <option value="Math">Math</option>
            <option value="Hindi">Hindi</option>
            <option value="Science">Science</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="History">History</option>
            <option value="Geography">Geography</option>
            <option value="Social">Social</option>
          </select>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#5a7488',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s',
        }}>
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {/* Error Message */}
      {error && <p style={{ color: 'red', marginTop: '20px', fontSize: '16px' }}>{error}</p>}

      {/* Results Display */}
      {score !== null && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '600px',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Total Score: {score}</h3>
          {results.map((item, index) => (
            <div key={index} style={{ marginBottom: '15px' }}>
              <p><strong>Q:</strong> {item.question || 'Not Available'}</p>
              <p><strong>Correct Answer:</strong> {item.correctAnswer || 'Not Available'}</p>
              <p><strong>Your Answer:</strong> {item.studentAnswer || 'Not Attempted'}</p>
              <p><strong>Topic:</strong> {item.topic || 'Not Attempted'}</p>
              <p><strong>Marks Awarded:</strong> {item.marks || '0'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
    </div></div></>
  );
}

export default PDFEvaluator;
