import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// import TeacherSalaryForPay from './TeacherSalaryForPay';
import UnpaidStudents from './UnpaidStudents';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// import SeperateLedgerNew from './Ledger';
// import SingleLedger from './SeperateLedger';
 
// A component to inject global styles for the `body` tag
const cellStyleD = {
  padding: '10px',
  borderBottom: '1px solid #ddd',
  fontSize: '14px',
  whiteSpace: 'nowrap'
};
const headerStyleD = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
  fontSize: '14px'
};
 
 
 
 
 
const GlobalStyles = () => {
  const styles = `
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: #f0f2f5;
    }

    /* 👇 ADD THIS NEW CSS RULE 👇 */
    input[type="date"]:focus {
        outline: none;
        border-color: #3498DB;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }
  `;
  return <style>{styles}</style>;
};
 
// Main App Component
function Interface() {
 
 
 
 
const schoolCode = localStorage.getItem('schoolCode') || 'DEFAULT'; // Provide a default value if not found
 
 
 
 
 
 
 
 
 
  return (
    <>
      <GlobalStyles />
 
<div style={styles.appContainer}>
  <Header schoolCode={schoolCode} />
  <main style={styles.mainContent}>
    <Dashboard schoolCode={schoolCode} />
  </main>
</div>
 
{/* here is ledger for new comopnent */}  
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
    </>
  );
}
 
 
 
// Header Component
const Header = ({ schoolCode: initialSchoolCode }) => {
  const [schoolName, setSchoolName] = useState('');
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
 
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) {
        console.warn('No school code found in localStorage. Aborting fetch.');
        return;
      }
      setDynamicSchoolCode(code);
      try {
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
          { secretecode: code },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        if (response.data.logoPath) {
          setDynamicLogoSrc(response.data.logoPath);
        }
      } catch (error) {
        console.error('Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, []);
 
  return (
    <header style={styles.header}>
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
            .accountant-header-right {
              gap: 0.5rem !important;
            }
            .logout-btn {
              padding: 6px 10px !important;
              font-size: 14px !important;
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
            .header {
              height: 80px !important;
              padding: 0 1rem !important;
            }
          }
        `}
      </style>
    
      {/* Logo */}
      <img
        src={dynamicLogoSrc || "/default-logo.png"}
        alt="School Logo"
        className="header-logo"
        style={styles.headerLogo}
      />
    
      {/* School Name - Centered */}
      <div
        className="header-wrapper"
        style={styles.headerWrapper}
      >
        <h1
          className="header-title"
          style={styles.headerTitle}
        >
          {dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL
        </h1>
      </div>
    
      {/* Accountant and Logout - Right Side */}
      <div className="accountant-header-right" style={styles.accountantHeaderRight}>
        
      </div>
    </header>
  );
};
 
// Dashboard Component
const Dashboard = ({ schoolCode }) => {
  // const location = useLocation();
  const navigate = useNavigate();
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState({ expenseName: '', amount: '', description: '' });
  const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);

  const [previousRequests, setPreviousRequests] = useState([]); // Will hold the fetched data
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
    const handleViewRequests = async () => {
        setIsStatusPopupOpen(true); // Open popup immediately
        setIsStatusLoading(true);   // Show loading indicator
        setStatusError('');         // Clear any previous errors
        setPreviousRequests([]);    // Clear old data

        try {
            const schoolCode = localStorage.getItem('schoolCode');
            const response = await axios.get('https://cleezoclass.com:4000/api/expense-requests', {
                params: { schoolCode } // Pass schoolCode to the backend
            });

            setPreviousRequests(response.data);
            if (response.data.length === 0) {
                setStatusError('No previous requests found.');
            }
        } catch (error) {
            console.error("Error fetching previous requests:", error);
            setStatusError('Failed to fetch request status. Please try again.');
        } finally {
            setIsStatusLoading(false); // Hide loading indicator
        }
    };

    const handleRequestFormChange = (e) => {
        const { name, value } = e.target;
        setRequestFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        // In a real app, you would send this data to the backend
        try {
            const schoolCode = localStorage.getItem('schoolCode');
            const response = await axios.post('https://cleezoclass.com:4000/api/expense-request', {
                ...requestFormData,
                schoolCode: schoolCode,
                submittedBy: 'nova9150', // Or a dynamic user identifier
            });

            if (response.status === 201) {
                alert(`Request for ${requestFormData.expenseName} (₹${requestFormData.amount}) submitted successfully!`);
            } else {
                alert('There was an issue submitting your request. Please try again.');
            }
        } catch (error) {
            console.error("Error submitting expense request:", error);
            alert('Failed to submit the request. Please check your connection and try again.');
        }

        setIsRequestFormOpen(false);
        setRequestFormData({ expenseName: '', amount: '', previousGraduate: '' });
    }
    const [error, setError] = useState(null);
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) {
        console.warn('No school code found in localStorage. Aborting fetch.');
        return;
      }
      setDynamicSchoolCode(code);
      try {
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
          { secretecode: code },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        if (response.data.logoPath) {
          setDynamicLogoSrc(response.data.logoPath);
        }
      } catch (error) {
        console.error('Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, []);
  const [classes] = useState(["Nursery", "LKG", "UKG", ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [isFetchingSections, setIsFetchingSections] = useState(false);
  const [totalPaid] = useState(5000000.00);
  const [totalPending] = useState(150000.00);
 
  const [selectedReportSection, setSelectedReportSection] = useState('');
  const [studentFees, setStudentFees] = useState([]);
  // const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [institute, setInstitute] = useState(''); 
  const [isLedgerOpenForClass, setIsLedgerOpenForClass] = useState(false);
  const [paidStudent,setPaidStudent]=useState()

    const [originalFeeData, setOriginalFeeData] = useState({ fees: [] });
const [filterFromDate, setFilterFromDate] = useState('2025-07-21');
const [filterToDate, setFilterToDate] = useState('2025-08-20');
const [unpaidFilterFromDate, setUnpaidFilterFromDate] = useState('2025-07-21');
const [unpaidFilterToDate, setUnpaidFilterToDate] = useState('2025-08-20');
 
// Expenes Component
 
 
 
// Add these new functions inside the Dashboard component
// const handlePrint = () => {
//   window.print();
// };
 
const handleDownload = (data, filename = 'ledger.csv') => {
  if (!data.length) {
    alert("No data to download.");
    return;
  }
  
  // Define CSV headers
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',') + '\n';
  
  // Format data rows
  const csvData = data.map(row => 
    headers.map(header => {
      let value = row[header];
      if (typeof value === 'string' && value.includes(',')) {
        value = `"${value}"`; // Quote values with commas
      }
      return value;
    }).join(',')
  ).join('\n');
 
  const csvContent = csvHeaders + csvData;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


const handleFeeFilter = () => {
    if (!filterFromDate || !filterToDate) {
        alert("Please select both a 'From' and 'To' date.");
        return;
    }

    const from = new Date(filterFromDate);
    const to = new Date(filterToDate);
    to.setHours(23, 59, 59, 999); // Ensure the entire end day is included

    const filteredFees = originalFeeData.fees.filter(fee => {
        const feeDate = new Date(fee.date);
        return feeDate >= from && feeDate <= to;
    });

    setFeeData(prevState => ({
        ...prevState,
        fees: filteredFees
    }));
};

const clearFeeFilter = () => {
    setFeeData(originalFeeData);
    setFilterFromDate('2025-07-21');
    setFilterToDate('2025-08-21');
};
 
  const [showPopupForSlip, setShowPopupForSlip] = useState(false);
 
 
const [personTotals, setPersonTotals] = useState({});
  const [totalSpend, setTotalSpend] = useState(0);
 
  const handleExpenseType = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    try {
      const res = await fetch("https://cleezoclass.com:4000/api/getExpenseData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode })
      });
 
      if (!res.ok) throw new Error(res.statusText);
 
      const data = await res.json();
 
      const totals = data.reduce((acc, item) => {
        const person = item.person_name || "Unknown";
        const paid = parseFloat(item.paid_amount) || 0;
        acc[person] = (acc[person] || 0) + paid;
        return acc;
      }, {});
 
      const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);
 
      setPersonTotals(totals);
      setTotalSpend(grandTotal);
 
    } catch (err) {
      console.error("Error fetching expense data:", err);
    }
  };
 
  useEffect(() => {
    handleExpenseType();
  }, []);
 
 
 
 
 
// new component ledger 
 
 
const [feeData, setFeeData] = useState({
  fees: [],
  total_fees: 0
});
const [isLedgerOpen, setIsLedgerOpen] = useState(false); 
const [isPaidLedgerOpen, setIsPaidLedgerOpen] = useState(false);
const [isUnpaidLedgerOpen, setIsUnpaidLedgerOpen] = useState(false);
const [classFeeMap, setClassFeeMap] = useState({}); 
 const classe = ['LKG', 'UKG', 'Nursery', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const section = ['A', 'B', 'C', 'D'];  
   const [selectedClasss, setSelectedClasss] = useState("1"); 
       const [selectedSection, setSelectedSection] = useState('');  
        const [selectedStudent, setSelectedStudent] = useState(null); 
        const [notification, setNotification] = useState(null);
        const [ledgerValue,setLedgerValue]= useState()
 
        const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
    const [expenseFormData, setExpenseFormData] = useState(null);
 
const totalFinalAmount = feeData.fees.reduce(
  (sum, item) => sum + parseFloat(item.finalAmount || 0),
  0
);
 
// };  
const showNotification = (message) => {
  setNotification(message);
  setTimeout(() => {
    setNotification(null);
  }, 3000); // Hide after 3 seconds
};
const [isSalaryPopupOpen, setIsSalaryPopupOpen] = useState(false);
const [isUnpaidSalaryPopupOpen, setIsUnpaidSalaryPopupOpen] = useState(false);




// ADD THE FOLLOWING PRINT/PDF FUNCTIONS
const handlePrint = (targetId) => {
    const targetNode = document.getElementById(targetId);
    if (!targetNode) {
        console.error("Print target not found!");
        return;
    }

    // Clone the node to get its content without the buttons
    const clonedNode = targetNode.cloneNode(true);
    const noPrintElements = clonedNode.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.remove());
    const printContents = clonedNode.innerHTML;

    // 1. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // 2. Write the content and new "bright" styles to the iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
            <head>
                <title>Print</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        -webkit-print-color-adjust: exact; /* Helps force colors in Chrome/Safari */
                        print-color-adjust: exact; /* Standard */
                    }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th {
                        background-color: #e0e0e0 !important; /* A light grey that prints well */
                        color: #000 !important; /* Black text */
                        font-weight: bold; /* Bold headers */
                    }
                    .no-print { display: none; }
                </style>
            </head>
            <body>
                ${printContents}
            </body>
        </html>
    `);
    doc.close();

    // 3. Trigger the print dialog from the iframe, avoiding a new tab
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    // 4. Remove the iframe after printing
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 500);
};

const handleDownloadPdf = (contentId, filename, title) => {
    const doc = new jsPDF({
        orientation: 'landscape'
    });

    const contentElement = document.getElementById(contentId);
    if (!contentElement) {
        console.error("PDF content source not found!");
        return;
    }

    const tableElement = contentElement.querySelector('table');
    if (!tableElement) {
        alert("No table found in the content to generate a PDF.");
        return;
    }

    const schoolName = dynamicSchoolCode.replace(/_/g, ' ') + ' SCHOOL';

    doc.setFontSize(16);
    doc.text(schoolName, 14, 15);
    doc.setFontSize(12);
    doc.text(title, 14, 22);

    let autoTableConfig = {
        html: tableElement,
        startY: 30,
        theme: 'grid',
        styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [22, 160, 133],
            fontSize: 8,
        }
    };

    if (title === 'Unpaid Students Report') {
        // Configuration for Unpaid Students Report
        autoTableConfig.columnStyles = {
            0: { cellWidth: 25 }, // Student Name
            1: { cellWidth: 25 }, // Father's Name
            2: { cellWidth: 20 }, // Mobile No.
            9: { cellWidth: 'auto' } // Installments column
        };
        
        autoTableConfig.didParseCell = function (data) {
            if (data.section === 'body') {
                // Check if it's the 'Installments' column (the last one)
                if (data.column.dataKey === data.table.columns.length - 1) {
                    // Check if the cell has raw text content
                    if (data.cell.raw && typeof data.cell.raw.innerText === 'string') {
                        // Add newlines before each "Installment X:" to force wrapping
                        const newText = data.cell.raw.innerText.replace(/(Installment\s\d:)/g, '\n$1').trim();
                        data.cell.text = newText.split('\n');
                    }
                }
            }
        };
    } else {
        // Configuration for other reports (reduced column sizes)
        autoTableConfig.columnStyles = {
            3: { cellWidth: 30 }, // Service Name
            4: { cellWidth: 35 }, // Student Name
            5: { cellWidth: 20 }, // Class & Section
            6: { cellWidth: 'auto' }, // Description
            8: { cellWidth: 25 }, // Total Amount
            9: { cellWidth: 25 }, // Payment INR
            11: { cellWidth: 25 } // Balance INR
        };
        
        // Optional: Add cell formatting for other reports if needed
        autoTableConfig.didParseCell = function (data) {
            // You can add general formatting for other reports here if needed
            // For example, ensuring text wrapping in specific columns
        };
    }

    autoTable(doc, autoTableConfig);
    doc.save(filename);
};
// END of new functions






// ADD THE FOLLOWING CODE BLOCK HERE
const [selectedImage, setSelectedImage] = useState(null);

const openImageModal = (imageUrl) => {
  setSelectedImage(imageUrl);
};

const closeImageModal = () => {
  setSelectedImage(null);
};
// END of new code block
 
const fetchDataBasedOnClassAndSection = async (className, section) => {
  try {
    const res = await fetch("https://cleezoclass.com:4000/api/getFeesDataOfStudents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolCode,
        className,
        sectionName: section
      })
    });
 
    if (!res.ok) throw new Error(res.statusText);
 
    const data = await res.json();
    const rawData = Array.isArray(data.data) ? data.data : [];
 
const fees = rawData.map(fee => ({
  id: fee.id || 0,
  student_name: fee.StudentName || "",
  class_name: fee.Class_name || "",
  section: fee.section || "",
  fee_type: fee.fee_type,
  amount: Number(fee.CompleteFee) || 0,
  totalFee: (
    Number(fee.CompleteFee || 0) + // Class fee
    Number(fee.bus_paid || 0)       // Bus fee
  ),
  paidAmount: (
    Number(fee.Paid_Amount || 0) +  // Main fee paid
    Number(fee.bus_paid || 0) +     // Bus fee paid
    Number(fee.books_paid || 0) +   // Books fee paid
    Number(fee.uniform_paid || 0) + // Uniform fee paid
    Number(fee.exam_paid || 0) +    // Exam fee paid
    Number(fee.others_paid || 0)    // Others fee paid
  ),
  discount: Number(fee.Discount) || 0,
  finalAmount: Number(fee.Final_Amount) || 0,
  date: fee.created_at || new Date().toISOString(),
  description: `Fee details for ${fee.StudentName || ""}`,
  father_name: fee.father_name || "",
  mobile_number: fee.phone_no ? String(fee.phone_no) : ""
}));
 
 
 
    const uniqueClasses = [...new Set(rawData.map(f => f.Class_name).filter(Boolean))];
    getCompleteFeeBasedOnClass(uniqueClasses);
    
    return fees;
  } catch (error) {
    console.error('Error fetching data:', error);
    showNotification("Request failed. Please try again.");
    return [];
  }
};
 
const getCompleteFeeBasedOnClass = async (classNames) => {
  try {
    const response = await axios.post(`https://cleezoclass.com:4000/api/getClassFeeDetailsledger`, {
      schoolCode,
      classNames
    });
 
    if (!response.data || response.data.error) {
      throw new Error(response.data.error || 'Failed to fetch class fee details');
    }
 
    console.log("Class-wise Complete Fees:", response.data.data);
 
    // ✅ 2. Save first fee for each unique class
    const uniqueFees = {};
    response.data.data.forEach((item) => {
      if (!uniqueFees[item.Class_name]) {
        uniqueFees[item.Class_name] = item.CompleteFee;
      }
    });
 
    // ✅ 3. Save to state
    setClassFeeMap(uniqueFees);
 
  } catch (error) {
    console.error("Error fetching class fee details:", error.message);
  }
};
 
 
 
const classFeeMaps = new Map(
  Object.entries(classFeeMap).map(([Class_name, CompleteFee]) => [
    Class_name,
    CompleteFee ? parseFloat(CompleteFee) : 0,
  ])
);
 
 
// Calculate total of all students' class fees
const totalFee = feeData.fees.reduce((acc, student) => {
  const fee = classFeeMaps.get(student.class_name) || 0;
  return acc + fee;
}, 0);
const fetchFeeDataNew = async () => {
  try {
    console.log('Fetching fee data without date filter...');
    const url = `https://cleezoclass.com:3020/api/feeDataFinanceNew?schoolCode=${schoolCode}`;
    console.debug('API URL:', url); // Debug: Log the constructed URL
    
    const response = await axios.post(url);
    console.debug('Raw API Response:', response); // Debug: Log complete response object
    console.log('API Response data:', response.data);
 
    if (!response.data || response.data.error) {
      console.error('API Error:', response.data.error || 'No data received');
      throw new Error(response.data.error || 'Failed to fetch finance data');
    }
 
    const feesData = response.data.results;
    console.debug('Raw fees data from API:', feesData); // Debug: Log raw fees data
 
    if (!Array.isArray(feesData)) {
      console.error('Unexpected data format - feesData is not an array:', feesData);
      throw new Error('Invalid data format received from server');
    }
 
    const fees = feesData
      .filter(fee => {
        const hasStudentName = fee.studentName != null;
        if (!hasStudentName) {
          console.debug('Filtered out fee entry without studentName:', fee);
        }
        return hasStudentName;
      })
      .map(fee => {
        console.debug('Processing fee entry:', fee); // Debug: Log each fee entry being processed
        
        const paidAmount = (Number(fee.Paid_Amount) || 0) +
                         (Number(fee.books_paid) || 0) +
                         (Number(fee.bus_paid) || 0) +
                         (Number(fee.uniform_paid) || 0) +
                         (Number(fee.exam_paid) || 0) +
                         (Number(fee.others_paid) || 0);
        
        const pending = (Number(fee.CompleteFee) || 0) - (paidAmount + (Number(fee.Discount) || 0));
 
        console.debug(`Calculated values for ${fee.studentName}:`, {
          paidAmount,
          pending,
          CompleteFee: fee.CompleteFee,
          Discount: fee.Discount
        });
 
        return {
          id: fee.id || 0,
          student_name: fee.studentName || "",
          class_name: fee.className || "",
          section: fee.Section || "",
          fee_type: fee.fee_type,
          amount: Number(fee.CompleteFee) || 0,
          paidAmount: paidAmount,
          discount: Number(fee.Discount) || 0,
          pending: pending,
          finalAmount: Number(fee.Final_Amount) || 0,
          date: fee.created_at || new Date().toISOString(),
          description: `Fee details for ${fee.studentName || ""}`
        };
      });
 
    console.debug('Processed fees array:', fees); // Debug: Log final processed fees array
 
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const totalPending = fees.reduce((sum, fee) => sum + fee.pending, 0);
 
    console.debug('Calculated totals:', { // Debug: Log calculated totals
      totalFees,
      totalPaid,
      totalPending
    });
 
    const feeDataState = {
      fees,
      total_fees: totalFees,
      total_paid: totalPaid,
      total_pending: totalPending
    };
    
setFeeData(feeDataState);
   setOriginalFeeData(feeDataState); // Store the original data
   console.debug('Fee data set in state:', feeDataState); // Debug: Log state being set
 
    const uniqueClasses = [...new Set(feesData.map(f => f.className).filter(Boolean))];
    console.debug('Unique classes found:', uniqueClasses); // Debug: Log unique classes
    getCompleteFeeBasedOnClass(uniqueClasses);
    
    console.log('Fee Data Set Successfully');
    setLedgerValue("All Students");
    setIsLedgerOpen(true);
  } catch (error) {
    console.error('Error fetching fee data:', error.message);
    console.error('Error stack:', error.stack); // Debug: Log error stack trace
    
    const errorState = {
      fees: [],
      total_fees: 0,
      total_paid: 0,
      total_pending: 0
    };
    
    setFeeData(errorState);
    console.debug('Error state set:', errorState); // Debug: Log error state
  }
};
 
 
 
 
const [loading, setLoading] = useState(true); 
const [allFees, setAllFees] = useState([]);
 
 
 
// src/components/YourFile.jsx (Inside Dashboard component)

const handlePaidLedger = async () => {
  // Add this check to ensure both class and section are selected
  if (!selectedClasss || !selectedSection) {
    alert("Please select both a class and a section to view the paid report.");
    return; // Stop the function if they aren't selected
  }

  const fees = await fetchDataBasedOnClassAndSection(selectedClasss, selectedSection);
  const paidFees = fees.filter(fee => fee.paidAmount > 0);
 
  const dataToSet = {
    fees: paidFees,
    total_fees: paidFees.reduce((sum, fee) => sum + fee.amount, 0)
  };

  setFeeData(dataToSet);
  setOriginalFeeData(dataToSet); // Store the original data
 
  setIsPaidLedgerOpen(true);
};
 
const handleUnpaidLedger = async () => {
  const fees = await fetchDataBasedOnClassAndSection(selectedClasss, selectedSection);
  const unpaidFees = fees.filter(fee => fee.paidAmount === 0);
  
  setFeeData({
    fees: unpaidFees,
    total_fees: unpaidFees.reduce((sum, fee) => sum + fee.amount, 0)
  });
  
  setIsUnpaidLedgerOpen(true);
};
 

// ADD THE NEW FUNCTION HERE
const handleOverallLedger = async () => {
    // First, check if a class is selected but a section is not.
    if (selectedClasss && !selectedSection) {
        alert("Please select both a class and a section to view the report.");
        return; // Stop the function and show the alert.
    }

    // If both are selected, show the class-specific report.
    if (selectedClasss && selectedSection) {
        setIsLedgerOpen(true); 
        const fees = await fetchDataBasedOnClassAndSection(selectedClasss, selectedSection);
        
        const dataToSet = {
            fees: fees,
            total_fees: fees.reduce((sum, fee) => sum + fee.amount, 0)
        };

        setFeeData(dataToSet);
        setOriginalFeeData(dataToSet);
        setLedgerValue(` ${selectedClasss.toUpperCase()}, Section: ${selectedSection.toUpperCase()}`);
    } else {
        // If neither is selected, show the school-wide report.
        fetchFeeDataNew(); 
    }
};


 
 
   const [projectedPending, setProjectedPending] = useState(0);
const [finalPaid, setFinalPaid] = useState(0);
const [finalPending, setFinalPending] = useState(0);
 
const fetchFeeDataNewForEffect = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    console.log("Starting fetchFeeDataNewForEffect with schoolCode:", schoolCode);
    
    try {
        setLoading(true);
        console.log("Loading set to true");
 
        const url = `https://cleezoclass.com:4000/api/feeDataFinanceNew?schoolCode=${schoolCode}`;
        console.log("Making request to URL:", url);
        
        console.log("Fetching fee data for schoolCode:", schoolCode);
        const response = await axios.post(url);
        console.log("Full fee data response:", response.data);
        console.log("Response received:", response);
 
        if (!response.data || response.data.error) {
            console.error("Error in response data:", response.data.error);
            throw new Error(response.data.error || 'Failed to fetch finance data');
        }
 
        const feesData = response.data.results || [];
        console.log("Raw fees data:", feesData);
 
        const fees = feesData.map(fee => ({
            id: fee.id || 0,
            student_name: fee.studentName || "",
            class_name: fee.className || "Unknown Class",
            section: fee.Section || "",
            fee_type: fee.fee_type,
            amount: Number(fee.CompleteFee) || 0,
            paidAmount: Number(fee.Paid_Amount) || 0,
            booksPaid: Number(fee.books_paid) || 0,
            busPaid: Number(fee.bus_paid) || 0,
            uniformPaid: Number(fee.uniform_paid) || 0,
            examPaid: Number(fee.exam_paid) || 0,
            othersPaid: Number(fee.others_paid) || 0,
            discount: Number(fee.Discount) || 0,
            finalAmount: Number(fee.Final_Amount) || 0,
            date: fee.created_at || new Date().toISOString(),
            description: `Fee details for ${fee.studentName || ""}`,
            totalPaidAmount: (
                Number(fee.Paid_Amount) +
                Number(fee.books_paid) +
                Number(fee.bus_paid) +
                Number(fee.uniform_paid) +
                Number(fee.exam_paid) +
                Number(fee.others_paid)
            ) || 0,
        }));
 
        console.log("Processed fees:", fees);
 
        const totalPaid = fees.reduce((sum, fee) => sum + fee.totalPaidAmount, 0);
        setFinalPaid(totalPaid);
        console.log("Total paid amount:", totalPaid);
 
        // Get student counts per class
        const studentCountsResponse = await axios.post(`https://cleezoclass.com:4000/api/studentCounts?schoolCode=${schoolCode}`);
        const studentCounts = studentCountsResponse.data.results || [];
        const classStudentCountMap = studentCounts.reduce((acc, { className, count }) => {
            acc[className] = count;
            return acc;
        }, {});
 
        // Calculate pending amounts by class
        const pendingByClass = feesData.reduce((acc, fee) => {
            const className = fee.className || 'Unknown Class';
            const completeFee = Number(fee.CompleteFee) || 0;
            const paidAmount = Number(fee.Paid_Amount) || 0;
            const booksPaid = Number(fee.books_paid) || 0;
            const busPaid = Number(fee.bus_paid) || 0;
            const uniformPaid = Number(fee.uniform_paid) || 0;
            const examPaid = Number(fee.exam_paid) || 0;
            const othersPaid = Number(fee.others_paid) || 0;
            const discount = Number(fee.Discount) || 0;
            const pending = completeFee - (paidAmount + booksPaid + busPaid + uniformPaid + examPaid + othersPaid + discount);
 
            if (!acc[className]) {
                acc[className] = {
                    totalStudents: classStudentCountMap[className] || 0,
                    totalPending: 0,
                    feeRecords: 0
                };
            }
            acc[className].feeRecords++;
            if (pending > 0) {
                acc[className].totalPending += pending;
            }
            return acc;
        }, {});
 
        // Calculate the total pending: (totalPending * studentCount) for all classes
        let newTotalPending = 0;
        Object.keys(pendingByClass).forEach(className => {
            const { totalPending, totalStudents } = pendingByClass[className];
            newTotalPending += totalPending * totalStudents;
        });
 
        // Subtract finalPaid to get the final pending amount
        const finalTotalPending = newTotalPending - totalPaid;
        console.log("New total pending (after calculation):", finalTotalPending);
        setFinalPending(finalTotalPending);
 
        console.log("Pending amounts by class:", pendingByClass);
 
        setAllFees(fees);
        setFeeData({ fees, total_fees: fees.reduce((sum, fee) => sum + fee.amount, 0) });
 
        const uniqueClasses = Object.keys(pendingByClass);
        console.log("Unique classes found:", uniqueClasses);
        getCompleteFeeBasedOnClass(uniqueClasses);
 
        return {
            fees,
            pendingByClass,
            studentCounts,
            totals: {
                paid: totalPaid,
                pending: finalTotalPending,
                projected: 0
            }
        };
 
    } catch (error) {
        console.error('Error fetching fee data:', error.message);
        console.error('Error stack:', error.stack);
        setAllFees([]);
        setFeeData({ fees: [], total_fees: 0 });
        throw error;
    } finally {
        console.log("Finished processing, setting loading to false");
        setLoading(false);
    }
};
 
useEffect(() => {
    fetchFeeDataNewForEffect();
}, []);
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
const tableStyles = {
    header: {
        border: '1px solid #ccc', padding: '10px', background: '#e3f2fd',
        fontWeight: '600', textAlign: 'left', color: '#333',
        fontSize: '14px'
    },
    cell: {
        border: '1px solid #ddd', padding: '10px', color: '#333', textAlign: 'left',
        fontSize: '14px',
        borderBottom: '1px solid #eee',
    }
};
 
 
function StudentFinder({ popupMode = false }) {
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [allStudentsInClass, setAllStudentsInClass] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showSectionPopup, setShowSectionPopup] = useState(false);
    const [showStudentPopup, setShowStudentPopup] = useState(false);
    const [financials, setFinancials] = useState(null);
    const [feeLoading, setFeeLoading] = useState(false);
    const [feeError, setFeeError] = useState(null);
    const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
    const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
    const [institutionData, setInstitutionData] = useState(null);
    
    const classes = ["Nursery", "LKG", "UKG", ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];
 
    const headerStyle = {
        color: 'black',
        position: 'sticky',
        top: '0',
        zIndex: '50',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 15px',
        width: '100%',
    };
 
    useEffect(() => {
        if (!selectedClass) {
            setSections([]);
            setAllStudentsInClass([]);
            setSelectedSection('');
            return;
        }
        
        const fetchClassData = async () => {
            setIsLoading(true);
            setSections([]);
            setAllStudentsInClass([]);
            setSelectedSection('');
            
            try {
                const formattedClassName = selectedClass.replace(/\s+/g, '').toLowerCase();
                const response = await axios.get(`https://cleezoclass.com:4000/api/studentsName/${formattedClassName}`, {
                    params: { schoolCode },
                });
                
                if (response.data && Array.isArray(response.data.students)) {
                    const studentData = response.data.students;
                    setAllStudentsInClass(studentData);
                    const allSectionNames = studentData.map(student => student.section);
                    const uniqueSections = [...new Set(allSectionNames)].filter(section => section).sort();
                    setSections(uniqueSections);
                } else {
                    setAllStudentsInClass([]);
                    setSections([]);
                }
            } catch (error) {
                console.error("Error fetching class data:", error);
                setAllStudentsInClass([]);
                setSections([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchClassData();
    }, [selectedClass, schoolCode]);
 
    useEffect(() => {
        if (selectedSection) {
            const filtered = allStudentsInClass.filter(student => student.section === selectedSection);
            setFilteredStudents(filtered);
            setShowSectionPopup(true);
        } else {
            setFilteredStudents([]);
            setShowSectionPopup(false);
        }
    }, [selectedSection, allStudentsInClass]);
const handleRowClick = async (student) => {
    setSelectedStudent(student);
    setFeeLoading(true);
    setFeeError(null);
    setFinancials(null);

    try {
        const response = await axios.get(`https://cleezoclass.com:4000/api/student-fee-details`, {
            params: {
                schoolCode: schoolCode,
                class: student.class_name,
                section: student.section,
                name: student.name
            }
        });
                let specificBusFee = 0; // Default value in case fetch fails
        try {
            const busFeeRes = await axios.post("https://cleezoclass.com:4000/get-bus-fee", {
                studentName: student.name,
                className: student.class_name.replace("Class ", ""),
                sectionName: student.section || "A",
                schoolCode: schoolCode,
            });

            if (busFeeRes.data.FeesDetails && busFeeRes.data.FeesDetails.Bus_fees) {
                specificBusFee = parseFloat(busFeeRes.data.FeesDetails.Bus_fees) || 0;
            }
        } catch (err) {
            console.error("Error fetching specific bus fee:", err);
            // Keep specificBusFee as 0, or handle error as needed
        }
        const feeData = response.data;
        const feeStructure = feeData.feeStructure || {};
        const studentDetails = feeData.studentDetails || {};

        // Calculate the total of all non-tuition fees
        const totalOtherFees =
            (parseFloat(feeStructure.admissionFee) || 0) +
            (parseFloat(feeStructure.bookFee) || 0) +
            (parseFloat(feeStructure.examFee) || 0) +
            (parseFloat(feeStructure.uniformFee) || 0) +
            (parseFloat(studentDetails.bus_paid) || 0) + // Note: using bus_paid as a proxy for the fee amount
            (parseFloat(feeStructure.otherFee) || 0);

        // Calculate the Tuition Fee by subtracting other fees from the complete fee
        const completeFee = parseFloat(feeStructure.CompleteFee) || 0;
        const calculatedTuitionFee = Math.max(0, completeFee - totalOtherFees); // Ensure it doesn't go below zero

        // --- MODIFIED LOGIC FOR INSTALLMENT OVERPAYMENT ---
        const installments = [];
        let overpaidAmount = 0;
        let totalPaidTuitionFee = 0;

        for (let i = 1; i <= 5; i++) {
            const installmentAmount = parseFloat(studentDetails[`Installment${i}_Amount`]) || 0;
            const paidAmountFromAPI = parseFloat(studentDetails[`Installment${i}_Paid`]) || 0;
            const deadline = studentDetails[`Installment${i}_Deadline_Date`];

            if (installmentAmount > 0) {
                // Combine current paid amount with overpayment from previous installments
                const totalPaidForThisInstallment = paidAmountFromAPI + overpaidAmount;
                const paidToThisInstallment = Math.min(installmentAmount, totalPaidForThisInstallment);

                // Calculate the remaining overpaid amount to carry to the next installment
                overpaidAmount = Math.max(0, totalPaidForThisInstallment - installmentAmount);
               
                totalPaidTuitionFee += paidToThisInstallment;

                installments.push({
                    name: `Installment ${i}`,
                    amount: installmentAmount.toFixed(2),
                    paid: paidToThisInstallment.toFixed(2),
                    deadline: deadline
                });
            }
        }
        // --- END OF MODIFIED LOGIC ---

        const structuredFinancials = {
            totalFee: completeFee.toFixed(2),
            totalPaid: (parseFloat(studentDetails.Paid_Amount) || 0).toFixed(2),
            discount: (parseFloat(studentDetails.fee_discount) || 0).toFixed(2),
            remainingAmount: (completeFee - (parseFloat(studentDetails.Paid_Amount) || 0)).toFixed(2),
            feeComponents: [
                { name: "Admission Fee", amount: (parseFloat(feeStructure.admissionFee) || 0).toFixed(2), paid: (parseFloat(studentDetails.Admission_paid) || 0).toFixed(2) },
                { name: "Tuition Fee", amount: calculatedTuitionFee.toFixed(2), paid: totalPaidTuitionFee.toFixed(2) },
                { name: "Book Fee", amount: (parseFloat(feeStructure.bookFee) || 0).toFixed(2), paid: (parseFloat(studentDetails.books_paid) || 0).toFixed(2) },
                { name: "Exam Fee", amount: (parseFloat(feeStructure.examFee) || 0).toFixed(2), paid: (parseFloat(studentDetails.exam_paid) || 0).toFixed(2) },
                { name: "Uniform Fee", amount: (parseFloat(feeStructure.uniformFee) || 0).toFixed(2), paid: (parseFloat(studentDetails.uniform_paid) || 0).toFixed(2) },
                { name: "Bus Fee", amount: specificBusFee.toFixed(2), paid: (parseFloat(studentDetails.bus_paid) || 0).toFixed(2) },
                { name: "Other Fees", amount: (parseFloat(feeStructure.othersFee) || 0).toFixed(2), paid: (parseFloat(studentDetails.others_paid) || 0).toFixed(2) }
            ],
            installments: installments
        };

        console.log("Structured Financials:", structuredFinancials);
        setFinancials(structuredFinancials);
        setShowStudentPopup(true);
    } catch (err) {
        console.error("Error fetching financial summary:", err);
        if (err.response && err.response.status === 404) {
            setFeeError("No fee record has been created for this student yet.");
        } else {
            setFeeError("Could not fetch financial data. Please try again later.");
        }
        setShowStudentPopup(true);
    } finally {
        setFeeLoading(false);
    }
};
 
 
 
 
    useEffect(() => {
        const fetchSchoolLogo = async () => {
            const code = localStorage.getItem('schoolCode');
            if (!code) {
                console.warn('No school code found in localStorage. Aborting fetch.');
                return;
            }
            setDynamicSchoolCode(code);
            try {
                const response = await axios.post(
                    'https://cleezoclass.com:4000/api/schoollogodynamic',
                    { secretecode: code },
                    { headers: { 'Content-Type': 'application/json' } }
                );
                if (response.data.logoPath) {
                    setDynamicLogoSrc(response.data.logoPath);
                } else {
                    console.warn('No logo path found in backend response.');
                }
            } catch (error) {
                console.error('Error fetching school logo:', error.response?.data || error.message);
            }
        };
    
        const data = localStorage.getItem('institutionData');
        if (data) {
            setInstitutionData(JSON.parse(data));
        }
        fetchSchoolLogo();
    }, []);
 
    const closeSectionPopup = () => {
        setShowSectionPopup(false);
    };
 
    const closeStudentPopup = () => {
        setShowStudentPopup(false);
        setSelectedStudent(null);
        setFinancials(null);
        setFeeError(null);
    };
 
    const formatCurrency = (amount) => {
        return `₹ ${Number(amount || 0).toLocaleString('en-IN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    };
 

//     const handlePrint = () => {
//     window.print();
// };

    const tableStyles = {
        header: {
            padding: '10px',
            backgroundColor: '#2980B9',
            textAlign: 'center',
            border: '1px solid #ddd',
            color:'white'
        },
        cell: {
            padding: '10px',
            border: '1px solid #eee'
        }
    };
 
    // Conditionally define styles based on the popupMode prop
    const styles = popupMode ? {
        // Original styles for the SUMMARY popup
        reportFilters: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            padding: '20px',
        },
        dropdown: {
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            minWidth: '170px',
            backgroundColor: '#3498DB',
            color:'white'
        },
        selectContainer: {
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
        },
    } : {
        // New responsive styles for the PARTIES card
        reportFilters: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            padding: '20px',
        },
        dropdown: {
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: '#3498DB',
            color: 'white',
            flex: '1 1 150px',
            minWidth: '150px',
            boxSizing: 'border-box',
        },
        selectContainer: {
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            width: '100%',
            flexWrap: 'wrap',
        },
    };

    // Conditionally set the style for the root div
    const rootStyle = popupMode ? { padding: '20px' } : {};
   const cellStyleD = {
  border: '1px solid black',
  padding: '8px',
  textAlign: 'center'
};
    return (
        <div style={{ padding: '20px' }}>
            <div style={styles.reportFilters}>
                <div style={styles.selectContainer}>
                    <select
                        style={styles.dropdown}
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">SELECT CLASS</option>
                        {classes.map((cls) => (
                            <option key={cls} value={cls}>
                                {cls.toUpperCase()}
                            </option>
                        ))}
                    </select>
 
                    <select
                        style={styles.dropdown}
                        disabled={isLoading || sections.length === 0}
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                    >
                        <option value="">
                            {isLoading ? "LOADING..." : "SELECT SECTION"}
                        </option>
                        {sections.map((sec) => (
                            <option key={sec} value={sec}>
                                {sec.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            {/* Section Students Popup */}
            {showSectionPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        width: '600px',
                        maxWidth: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                    }}>
                        <div style={{ padding: '20px' }}>
                            <div style={{ 
                                marginBottom: '20px',
                                padding: '15px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                borderLeft: '4px solid #2980B9'
                            }}>
                                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Class Information</p>
                                <p style={{ margin: '4px 0' }}><strong>Class:</strong> {selectedClass}</p>
                                <p style={{ margin: '4px 0' }}><strong>Section:</strong> {selectedSection}</p>
                                <p style={{ margin: '4px 0' }}><strong>Total Students:</strong> {filteredStudents.length}</p>
                            </div>
 
                            {filteredStudents.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#e3f2fd' }}>
                                            <th style={tableStyles.header}>ID</th>
                                            <th style={tableStyles.header}>Name</th>
                                            <th style={tableStyles.header}>Class</th>
                                            <th style={tableStyles.header}>Section</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map(student => (
                                            <tr 
                                                key={student.id} 
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    ':hover': { backgroundColor: '#f5f5f5' } 
                                                }} 
                                                onClick={() => {
                                                    closeSectionPopup();
                                                    handleRowClick(student);
                                                }}
                                            >
                                                <td style={tableStyles.cell}>{student.id}</td>
                                                <td style={tableStyles.cell}>{student.name}</td>
                                                <td style={tableStyles.cell}>{selectedClass}</td>
                                                <td style={tableStyles.cell}>{student.section}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#777' }}>
                                    No students found in this section.
                                </div>
                            )}
                        </div>
                        
                        <div style={{
                            padding: '15px 20px',
                            borderTop: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            position: 'sticky',
                            bottom: 0,
                            background: 'white'
                        }}>
                            <button 
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }} 
                                onClick={closeSectionPopup}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
 
       {/* Student Fee Details Popup */}
{showStudentPopup && selectedStudent && (
    <>

 
        {/* Regular Popup Content */}
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}
            onClick={closeStudentPopup}
        >
            <div
    id="student-popup-content-to-print" // Add this ID
    style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '750px',
        maxWidth: '95%',
        maxHeight: '95vh',
        overflowY: 'auto',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        fontSize: '0.8rem'
    }}
    onClick={(e) => e.stopPropagation()}
>
                <div style={{
                    padding: '2px 2px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    background: 'white',
                    zIndex: 1,
                    width: '100%',
                }}>
                    <header style={headerStyle}>
                        <div style={{ width: '60px' }}>
                            {dynamicLogoSrc && (
                                <img
                                    src={dynamicLogoSrc}
                                    alt="School Logo"
                                    style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                                    className="header-logo"
                                />
                            )}
                        </div>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <h1 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0, color: 'black' }}>
                                {dynamicSchoolCode.replace(/_/g, ' ')}
                            </h1>
                        </div>
                        <div>
                            <img
                                src="https://placehold.co/60x60/E2F0FF/333?text=Student"
                                alt={`${selectedStudent.name}'s Photo`}
                                style={{
                                    borderRadius: '50%',
                                    border: '2px solid #e3f2fd',
                                    width: '50px',
                                    height: '50px',
                                }}
                            />
                        </div>
                    </header>
                </div>
 
                <div style={{ padding: '5px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', paddingLeft: '5px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'left', margin: '3px 0' }}>
                                <strong>Name:</strong>
                                <span>{selectedStudent.name || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'left', margin: '3px 0' }}>
                                <strong>Roll No:</strong>
                                <span>{selectedStudent.id || 'N/A'}</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'left', margin: '6px 0' }}>
                                <strong>Contact:</strong>
                                <span>{selectedStudent.phone_no || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'left', margin: '3px 0' }}>
                                <strong>Father Name:</strong>
                                <span>{selectedStudent.father_name || 'N/A'}</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'left', margin: '3px 0' }}>
                                <strong>Class:</strong>
                                <span>{selectedStudent.class_name || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'left', margin: '3px 0' }}>
                                <strong>Section:</strong>
                                <span>{selectedStudent.section || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
 
                    <div style={{ marginTop: '-5px' }}>
                        <h4 style={{
                            borderBottom: '1px solid #eee',
                            paddingBottom: '2px',
                            marginBottom: '10px',
                            fontSize: '1rem'
                        }}>
                            Financial Summary
                        </h4>
 
                        {feeLoading && (
                            <div style={{ textAlign: 'center', padding: '15px', color: '#777' }}>
                                Loading fee details...
                            </div>
                        )}
 
                        {feeError && (
                            <div style={{
                                color: '#dc3545',
                                padding: '8px',
                                backgroundColor: '#f8d7da',
                                borderRadius: '4px',
                                marginBottom: '10px',
                                fontSize: '0.8rem'
                            }}>
                                {feeError}
                            </div>
                        )}
 
                        {financials && (
                            <div>
                                <div style={{ borderTop: '2px solid #333', paddingTop: '4px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.5rem' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '3px 0', textAlign: 'center' }}>
                                                    <strong>Discount:</strong>
                                                </td>
                                                <td style={{ textAlign: 'right', color: '#dc3545', padding: '6px 0' }}>
                                                    {formatCurrency(financials.discount)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '3px 0', textAlign: 'center' }}>
                                                    <strong>Total Fee:</strong>
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                                    {formatCurrency(financials.totalFee)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '3px 0', textAlign: 'center' }}>
                                                    <strong>Total Paid:</strong>
                                                </td>
                                                <td style={{ textAlign: 'right', color: '#28a745', padding: '6px 0' }}>
                                                    {formatCurrency(financials.totalPaid)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '6px 0', textAlign: 'center', borderBottom: '2px solid #333' }}>
                                                    <strong>Balance Due:</strong>
                                                </td>
                                                <td style={{ textAlign: 'right', color: financials.remainingAmount > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold', padding: '6px 0', borderBottom: '2px solid #333' }}>
                                                    {formatCurrency(financials.remainingAmount)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <tbody>
                                            {financials.feeComponents.map((component, index) => {
                                                const remaining = (parseFloat(component.amount) || 0) - (parseFloat(component.paid) || 0);
                                                return (
                                                    <tr key={`comp-${index}`}>
                                                        <td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                                                            <strong>{component.name}:</strong>
                                                        </td>
                                                        <td style={{ textAlign: 'right', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                                                            {formatCurrency(component.amount)}
                                                        </td>
                                                        <td style={{ textAlign: 'right', color: '#28a745', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                                                            {formatCurrency(component.paid)}
                                                        </td>
                                                        <td style={{ textAlign: 'right', color: remaining > 0 ? '#dc3545' : '#555', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                                                            {formatCurrency(remaining)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
 
                    {financials?.installments?.length > 0 && (
                        <div>
                            <h4 style={{
                                borderBottom: '1px solid #eee',
                                paddingBottom: '6px',
                                marginBottom: '10px',
                                fontSize: '1rem'
                            }}>
                                Installment Breakdown
                            </h4>
 
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ background: '#e3f2fd' }}>
                                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                            Installment
                                        </th>
                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                            Amount
                                        </th>
                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                            Paid
                                        </th>
                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                            Balance Due
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {financials.installments.map((item, index) => {
                                        const remaining = (item.amount || 0) - (item.paid || 0);
                                        return (
                                            <tr key={index}>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                                    {item.name}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>
                                                    {formatCurrency(item.amount)}
                                                </td>
                                                <td style={{ textAlign: 'right', color: '#28a745', padding: '8px', borderBottom: '1px solid #eee' }}>
                                                    {formatCurrency(item.paid)}
                                                </td>
                                                <td style={{ textAlign: 'right', color: remaining > 0 ? '#dc3545' : '#555', fontWeight: remaining > 0 ? 'bold' : 'normal', padding: '8px', borderBottom: '1px solid #eee' }}>
                                                    {formatCurrency(remaining)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
 
                <div 
                className="no-print"
                style={{
                    padding: '10px 15px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    bottom: 0,
                    background: 'white'
                }}>
<button
    style={{
        padding: '6px 12px',
        backgroundColor: feeLoading ? '#cccccc' : '#6c757d', // Dims the button when loading
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: feeLoading ? 'not-allowed' : 'pointer', // Changes cursor to show it's disabled
        fontSize: '0.8rem',
        transition: 'background-color 0.2s'
    }}
    onClick={() => handlePrint('student-popup-content-to-print')}
    disabled={feeLoading}  // This prevents clicking while loading
>
    {feeLoading ? 'Loading...' : 'Print'}
</button>
                    <button
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                        }}
                        onClick={closeStudentPopup}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    </>
)}
        </div>
    );
}
 
  useEffect(() => {
    if (!selectedClass || !schoolCode) {
      setSections([]);
      return;
    }
    const fetchStudentsAndExtractSections = async () => {
      setIsFetchingSections(true);
      setSections([]);
      try {
        const formattedClassName = selectedClass.replace(/\s+/g, '').toLowerCase();
        const response = await axios.get(`https://cleezoclass.com:4000/api/studentsName/${formattedClassName}`, {
          params: { schoolCode },
        });
        if (Array.isArray(response.data.students)) {
          const allSectionNames = response.data.students.map(student => student.section);
          const uniqueSections = [...new Set(allSectionNames)].filter(section => section).sort();
          setSections(uniqueSections);
        }
      } catch (error) {
        console.error("Error fetching students to extract sections:", error);
      } finally {
        setIsFetchingSections(false);
      }
    };
    fetchStudentsAndExtractSections();
  }, [selectedClass, schoolCode]);
 
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) return;
      try {
        const response = await axios.post('https://cleezoclass.com:4000/api/schoollogodynamic', { secretecode: code });
        if (response.data.logoPath) {
          setDynamicLogoSrc(response.data.logoPath);
          setInstitute(response.data.institute);
        }
      } catch (error) {
        console.error('Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, []);
  const [studentCount, setStudentCount] = useState(null);
   const [teacherCount, setTeacherCount] = useState(null);

  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        // Retrieve schoolCode from localStorage
        const schoolCode = localStorage.getItem('schoolCode');
 
        // Check if schoolCode exists
        if (!schoolCode) {
          console.error('No schoolCode found in localStorage');
          return;
        }
 
        // Make the API call with schoolCode as a query parameter
        const response = await fetch(`https://cleezoclass.com:4000/api/students/count?schoolCode=${encodeURIComponent(schoolCode)}`);
        const data = await response.json();
        setStudentCount(data.studentCount);
      } catch (error) {
        console.error('Error fetching student count:', error);
      }
    };
 
    fetchStudentCount();
  }, []); 
  
useEffect(() => {
  const fetchTeacherCount = async () => {
    try {
      console.log('Fetching teacher count...'); // Debug: Log start of fetch

      const schoolCode = localStorage.getItem('schoolCode');
      console.log('schoolCode from localStorage:', schoolCode); // Debug: Log schoolCode

      if (!schoolCode) {
        console.error('No schoolCode found in localStorage');
        return;
      }

      const response = await fetch(`https://cleezoclass.com:4000/api/teacher/count?schoolCode=${encodeURIComponent(schoolCode)}`);
      console.log('Response status:', response.status); // Debug: Log response status

      const data = await response.json();
      console.log('Response data:', data); // Debug: Log response data

      setTeacherCount(data.teacherCount);
    } catch (error) {
      console.error('Error fetching teacher count:', error);
    }
  };

  fetchTeacherCount();
}, []);

  const fetchDataForLedger = async (className, section) => {
    try {
      const formattedClassName = className.toLowerCase().replace(' ', '');
      
      const res = await fetch("https://cleezoclass.com:4000/getFeesDataOfStudents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolCode,
          className: formattedClassName,
          sectionName: section,
        }),
      });
 
      if (!res.ok) throw new Error(res.statusText);
 
      const data = await res.json();
      const fees = Array.isArray(data.data) ? data.data : [];
      setStudentFees(fees);
 
      if (fees.length === 0) {
        alert("No ledger data found for the selected class and section.");
      } else {
        setIsLedgerOpen(true);
      }
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      alert("Failed to fetch ledger data. Please try again.");
    }
  };
 
  const handleViewLedger = () => {
    if (selectedClass && selectedReportSection) {
      fetchDataForLedger(selectedClass, selectedReportSection);
    } else {
      alert("Please select both a class and a section to view the ledger.");
    }
  };
 
  const totalPaidAmount = studentFees.reduce((acc, item) => acc + (Number(item.Paid_Amount) || 0), 0);
  const thStyle = { padding: '8px', border: '1px solid #ccc', fontWeight: '600', fontSize: '0.9rem' };
  const tdStyle = { padding: '8px', border: '1px solid #ccc', fontSize: '0.85rem', textAlign: 'center' };
  const cellStyleD = { padding: '10px', borderBottom: '1px solid #ddd', fontSize: '14px', whiteSpace: 'nowrap' };
  const [totals, setTotals] = useState({
    totalPaid: 0,
    totalBalance: 0,
    totalPrice: 0,
    loading: true,
    error: null
  });
 
     const [total, setTotal] = useState({
        total_investment: 0,
        total_other: 0,
        total_donation: 0,
        grand_total: 0
    });
const [isLedgerOpenForExpense, setIsLedgerOpenForExpense] = useState(false);
  const [showStudentFinder, setShowStudentFinder] = useState(false);
    const [income, setIncome] = useState({
        total_investment: 0,
        total_other: 0,
        total_donation: 0,
        grand_total: 0,
        loading: true,
        error: null
    });
const fetchTotals = async (schoolCode) => {
        setTotals(prev => ({ ...prev, loading: true, error: null }));
        try {
            const response = await fetch(`https://cleezoclass.com:4000/api/totals?schoolCode=${schoolCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch totals');
            }
            const data = await response.json();
            setTotals({
                totalPaid: parseFloat(data.totals.paid) || 0,
                totalBalance: parseFloat(data.totals.balance) || 0,
                totalPrice: parseFloat(data.totals.price) || 0,
                loading: false,
                error: null
            });
        } catch (err) {
            setTotals(prev => ({
                ...prev,
                loading: false,
                error: err.message
            }));
        }
    };

    // Function to fetch income data
    const fetchIncome = async (schoolCode) => {
        setIncome(prev => ({ ...prev, loading: true, error: null }));
        try {
            const response = await axios.get('https://cleezoclass.com:4000/api/otherincome/totalsincome', {
                params: {
                    schoolCode: schoolCode
                }
            });
            if (response.data.success) {
                setIncome({
                    ...response.data.data,
                    loading: false,
                    error: null
                });
            } else {
                throw new Error('Failed to load income data');
            }
        } catch (err) {
            setIncome(prev => ({
                ...prev,
                loading: false,
                error: err.message
            }));
        }
    };

    // useEffect to run both fetches on component mount
    useEffect(() => {
        const schoolCode = localStorage.getItem('schoolCode');
        if (schoolCode) {
            fetchTotals(schoolCode);
            fetchIncome(schoolCode);
        } else {
            setTotals(prev => ({ ...prev, loading: false, error: 'School code not found' }));
            setIncome(prev => ({ ...prev, loading: false, error: 'School code not found' }));
        }
    }, []);

    // ... (rest of your component rendering logic)
   

  // Fetch data on component mount

   // Refresh data handler
  const handleRefresh = () => {
    fetchTotals();
  };
// src/components/Interface.jsx

// REPLACE the existing handleSearch function with this new one
const handleSearch = async () => {
  const schoolCode = localStorage.getItem("schoolCode");
  if (!schoolCode) {
    console.error("School code not found.");
    return;
  }

  setIsLedgerOpenForExpense(true); // Open popup immediately to show loading state

  try {
    // --- 1. Fetch both datasets in parallel ---
    const expensesPromise = axios.get(`https://cleezoclass.com:4000/api/totalexpensesData?schoolCode=${schoolCode}`);
    const billsPromise = fetch("https://cleezoclass.com:4000/getAllBills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolCode })
    });

    const [expensesResponse, billsResponse] = await Promise.all([expensesPromise, billsPromise]);

    // --- 2. Process regular expenses ---
    const expensesData = expensesResponse.data || [];

    // --- 3. Process and transform uploaded bills ---
    let uploadedBillsData = [];
    if (billsResponse.ok) {
        const rawBills = await billsResponse.json();
        uploadedBillsData = rawBills.map(bill => ({
            id: bill.id || `bill_${Math.random()}`,
            expense_date: bill.date,
            expense_type: bill.bill_type || "Uploaded Bill",
            description: bill.description || "N/A",
            payment_mode: "N/A",
            price: Number(bill.amount) || 0,
            paid_amount: Number(bill.amount) || 0,
            balance_amount: 0,
            imageUrl: bill.imageUrl, // Keep the imageUrl for the action button
            isUploadedBill: true,    // Add a flag to identify these rows
        }));
    } else {
        console.error("Failed to fetch uploaded bills");
    }

    // --- 4. Merge the two datasets ---
    const mergedData = [...expensesData, ...uploadedBillsData];
    
    // Sort by date, with newest first
    mergedData.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
    
    setUserExpensesData(mergedData);
    setOriginalUserExpensesData(mergedData);

  } catch (error) {
    console.error('Error fetching combined expenses data:', error);
    setUserExpensesData([]);
    setOriginalUserExpensesData([]);
  }
};
       const [expensesData,setExpensesData]= useState()
    const [userExpensesData,setUserExpensesData]= useState()

const [originalUserExpensesData, setOriginalUserExpensesData] = useState(null);

 const fetchExpensesData = async (dateRange) => {
    const schoolCode = localStorage.getItem("schoolCode")
    // const schoolCode = localStorage.getItem("schoolCode")
    // let url = "https://cleezoclass.com:4000/api/totalexpenses"; 
     let url = "https://cleezoclass.com:4000/api/totalexpensesData";
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.includes(" to ")) {
        const [startDate, endDate] = dateRange.split(" to ");
        params.append("startDate", startDate);
        params.append("endDate", endDate);
        // params.append("schoolCode",schoolCode)
      } else {
        params.append("date", dateRange);
        // params.append("schoolCode",schoolCode)
      }
    }
    if (schoolCode) {
      params.append("schoolCode", schoolCode);
    }
    try {
      const response = await axios.get(`${url}?${params.toString()}`);
      const data = response.data || [];
      console.log(data)
         setUserExpensesData(data);
   setOriginalUserExpensesData(data); // Store the original, unfiltered data
 
      setExpensesData({
        expenses: Array.isArray(data) ? data.map(item => ({
          id: item.id || 0,
          type: item.type || "N/A",
          amount: Number(item.amount) || 0,
          quantity: Number(item.quantity) || 1,
          total_cost: Number(item.total_cost) || 0,
          vendor_name: item.vendor_name || "N/A",
          vendor_contact: item.vendor_contact || "N/A",
          payment_method: item.payment_method || "N/A",
          date: item.date || new Date().toISOString(),
          description: item.description || "No description",
          rent_type: item.rent_type || "",
          vendor_type: item.vendor_type || ""
        })) : [],
       price: Array.isArray(data) ?
          data.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0) : 0
      });
      setIsLedgerOpenForExpense(true)
    } catch (error) {
      console.error('Error fetching expenses data:', error);
      setExpensesData({
        expenses: [],
        price: 0
      });
    }
  };



const handleExpenseDateFilter = () => {
    if (!fromDate || !toDate) {
        alert("Please select both a 'From' and 'To' date.");
        return;
    }
    const start = new Date(fromDate);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day

    if (originalUserExpensesData) {
        const filteredData = originalUserExpensesData.filter(expense => {
            const expenseDate = new Date(expense.expense_date); // Use 'expense_date' field
            return !isNaN(expenseDate.getTime()) && expenseDate >= start && expenseDate <= end;
        });
        setUserExpensesData(filteredData);
    }
};

const clearExpenseDateFilter = () => {
    setUserExpensesData(originalUserExpensesData);
    setFromDate("2025-07-21");
    setToDate("2025-08-21");
};



const [fromDate, setFromDate] = useState("2025-07-21");
const [toDate, setToDate] = useState("2025-08-21");
 const totalExpenseAmount = Array.isArray(userExpensesData)
  ? userExpensesData.reduce((sum, item) => sum + ((item && item.price) || 0), 0)
  : 0;
 
const totalFinalExpenseAmount = Array.isArray(userExpensesData)
  ? userExpensesData.reduce((sum, item) => sum + ((item && item.balance_amount) || 0), 0)
  : 0;
 
    const headerStyleDe = {
  padding: '10px 12px',
  border: '1px solid #ddd',
  backgroundColor: 'rgba(45, 62, 80, 1)',
  color: '#fff',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};
 
const cellStyleDe = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};
 
const tableStylee = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',  // fixed layout for equal widths
};
 
const colWidths = [
  '8%',   // Bill Number
  '10%',  // Date
  '12%',  // Type
  '23%',  // Description_name
  '12%',  // Payment Mode
  '10%',  // Total Amount
  '10%',  // Payment INR
  '8%',   // Balance INR
  '7%',   // Action (NEW)
];
    
  return (
    <>
      <div style={styles.dashboardGrid}>
          <div style={styles.dashboardColumn}>
                <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              PROFILES/PARTIES
            </h2>
          </div> 
            <Card title="">
               <div style={styles.feesManageHeader}>
                <h3 style={styles.cardSubHeader}>SCHOOL PROFILE</h3>
                <div style={styles.headerActions}>
                  <HoverLink to="/Schoolprofile" baseStyle={styles.btnAddBlue} hoverStyle={styles.btnAddBlueHover}>Add</HoverLink>
                  <HoverLink to="/Schoolprofile" baseStyle={styles.btnIcon} hoverStyle={styles.btnIconHover}><FaPlus /></HoverLink>
                </div>
              </div>
            </Card>
            <Card title="">
                <div style={styles.feesManageHeader}>
                <h3 style={styles.cardSubHeader}>PARTIES</h3>
                <div style={styles.headerActions}>
                  <HoverLink to="" baseStyle={styles.btnAddBlue} hoverStyle={styles.btnAddBlueHover}>Add</HoverLink>
                  <HoverLink to="" baseStyle={styles.btnIcon} hoverStyle={styles.btnIconHover}><FaPlus /></HoverLink>
                </div>
              </div>
              <div style={{
  textAlign: 'left',
  margin: '20px 0',
  fontFamily: 'Arial, sans-serif',
  width: '100%' // Ensure the div spans the full width of its container
}}>
  <h1 style={{
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
  }}>
    Total Students
  </h1>
  {studentCount !== null ? (
    <p style={{
      fontSize: '18px',
      color: '#555',
      margin: '0' // Ensure no extra margin is applied
    }}>
    <strong> {studentCount} students</strong> 
    </p>
  ) : (
    <p style={{
      fontSize: '14px',
      color: '#666',
      marginBottom: '4px',
    }}>
      Loading student count...
    </p>
  )}
</div>
                <StudentFinder />
            </Card>
            
        </div>
 
    <div style={styles.dashboardColumn}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                INCOMES
              </h2>
            </div>  
            <Card title="">
              <div style={styles.feesManageCard}>
                <div style={styles.feesManageHeader}>
                  <h3 style={styles.cardSubHeader}>FEES MANAGEMENT</h3>
                  <div style={styles.headerActions}>
                    <HoverLink to="/IncomeForm" baseStyle={styles.btnAddBlue} hoverStyle={styles.btnAddBlueHover}>Add</HoverLink>
                    <HoverLink to="/IncomeForm" baseStyle={styles.btnIcon} hoverStyle={styles.btnIconHover}><FaPlus /></HoverLink>
                  </div>
                </div>
<div style={styles.feesSummary}>
  <div style={styles.feesItem}>
    <span style={styles.feesItemLabel}>TOTAL PAID</span>
    <strong style={{ ...styles.feesItemAmount, ...styles.amountPaid }}>
      ₹ {finalPaid.toFixed(2)}
    </strong>
  </div>
<div style={styles.feesItem}>
  <span style={styles.feesItemLabel}>TOTAL PENDING</span>
  <strong style={{ ...styles.feesItemAmount, ...styles.amountPending }}>
    ₹ {finalPending.toFixed(2)}
  </strong>
</div>
 
</div>
                <div style={styles.feesActions}>
                  <div style={styles.actionRow}>
    <div>
  <HoverButton
    baseStyle={styles.btnLight}
    hoverStyle={styles.btnLightHover}
    onClick={() => setShowStudentFinder(true)}
  >
    SUMMARY
  </HoverButton>
  
  {/* Popup/Modal Container */}
{showStudentFinder && (
 <div style={{
   position: 'fixed',
   top: 0,
   left: 0,
   right: 0,
   bottom: 0,
   backgroundColor: 'rgba(0, 0, 0, 0.5)',
   display: 'flex',
   justifyContent: 'center',
   alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
   paddingTop: '33vh',       // Added padding to position it from the top
   zIndex: 1000,
 }}>
   {/* Popup Content */}
   <div style={{
     backgroundColor: 'white',
     borderRadius: '8px',
     width: '90%',
     maxWidth: '1000px',
     maxHeight: '90vh',
     overflow: 'auto',
     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
     position: 'relative',
     // marginTop: '5vh' // This is no longer needed
   }}>
     {/* Close button (top-right corner) */}
     <button 
       onClick={() => setShowStudentFinder(false)}
       style={{
         position: 'absolute',
         top: '10px',
         right: '10px',
         background: 'none',
         border: 'none',
         fontSize: '1.2rem',
         cursor: 'pointer',
         color: '#666',
         zIndex: 1
       }}
     >
       ×
     </button>
     
     {/* StudentFinder component */}
     <StudentFinder 
       onClose={() => setShowStudentFinder(false)}
       popupMode={true} // Optional: if you want StudentFinder to know it's in popup mode
     />
   </div>
 </div>
)}
</div>
                    <HoverButton
                      baseStyle={styles.btnLight}
                      hoverStyle={styles.btnLightHover}
                      onClick={() => navigate('/GenerateBillPrint')}
                    >
                      PRINT
                    </HoverButton>
                    <HoverButton
                      baseStyle={styles.btnLight}
                      hoverStyle={styles.btnLightHover}
                      onClick={() => navigate('/GenerateBills')}
                    >
                      EDIT
                    </HoverButton>
                  </div>
                  <div style={styles.actionRow}>
                    <HoverButton
                      baseStyle={styles.btnGreen}
                      hoverStyle={styles.btnGreenHover}
                      onClick={() => navigate('/PaidAmount')}
                    >
                      PAY-FEE
                    </HoverButton>
                <HoverButton
      baseStyle={styles.btnYellow}
      hoverStyle={styles.btnYellowHover}
      onClick={() => alert('Reminder saved successfully!')}
  >
      REMINDER
  </HoverButton>
                  </div>
                </div>
              </div>
            </Card>
            {/* <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                INCOMES
              </h2>
            </div>   */}
               <Card title="">
              <div style={styles.feesManageCard}>
                <div style={styles.feesManageHeader}>
                  <h3 style={styles.cardSubHeader}>Other Incomes</h3>
                  <div style={styles.headerActions}>
                    <HoverLink to="/IncomeForm2" baseStyle={styles.btnAddBlue} hoverStyle={styles.btnAddBlueHover}>Add</HoverLink>
                    <HoverLink to="/IncomeForm2" baseStyle={styles.btnIcon} hoverStyle={styles.btnIconHover}><FaPlus /></HoverLink>
                  </div>
                </div>
<div style={styles.feesSummary}>
    <div style={styles.feesItem}>
        <span style={styles.feesItemLabel1}>Total Investments</span>
        <strong style={{ ...styles.feesItemAmount1, ...styles.amountPaid }}>
            ₹{Number(income.total_investment).toFixed(2)}
        </strong>
    </div>

    <div style={styles.feesItem}>
        <span style={styles.feesItemLabel1}>Total Other Income</span>
        <strong style={{ ...styles.feesItemAmount1, ...styles.amountPaid }}>
            ₹{Number(income.total_other).toFixed(2)}
        </strong>
    </div>

    <div style={styles.feesItem}>
        <span style={styles.feesItemLabel1}>Total Donations</span>
        <strong style={{ ...styles.feesItemAmount1, ...styles.amountPaid }}>
            ₹{Number(income.total_donation).toFixed(2)}
        </strong>
    </div>

    <div style={styles.feesItem}>
        <span style={styles.feesItemLabel1}>GRAND TOTAL</span>
        <strong style={{ ...styles.feesItemAmount1, ...styles.amountPaid }}>
            ₹{(Number(income.total_investment) + Number(income.total_other) + Number(income.total_donation)).toFixed(2)}
        </strong>
    </div>
</div>

  
                <div style={styles.feesActions}>
                  <div style={styles.actionRow}>
                    <HoverButton
                      baseStyle={styles.btnLight}
                      hoverStyle={styles.btnLightHover}
                      onClick={() => navigate('/generateBill')}
                    >
                      SEARCH
                    </HoverButton>
                    <HoverButton
                      baseStyle={styles.btnLight}
                      hoverStyle={styles.btnLightHover}
                      onClick={() => navigate('/PaidAmountdemo')}
                    >
                      PRINT
                    </HoverButton>
                    <HoverButton
                      baseStyle={styles.btnLight}
                      hoverStyle={styles.btnLightHover}
                      onClick={() => navigate('/GenerateBill')}
                    > 
  
                      EDIT
                    </HoverButton>
                  </div>
                  <div style={styles.actionRow}>
                    <HoverButton
                      baseStyle={styles.btnGreen}
                      hoverStyle={styles.btnGreenHover}
                      onClick={() => navigate('/PaidAmount')}
                    >
                      GENERATE
                    </HoverButton>
                <HoverButton
      baseStyle={styles.btnYellow}
      hoverStyle={styles.btnYellowHover}
      onClick={() => alert('Reminder saved successfully!')}
  >
      REMINDER
  </HoverButton>
                  </div>
                </div>
              </div>
            </Card>
          </div>
            <div style={styles.dashboardColumn}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              EXPENSES
            </h2>
          </div>          
             <Card title="">
            <div style={styles.feesManageCard}>
              <div style={styles.feesManageHeader}>
                <h3 style={styles.cardSubHeader}>STAFF MANAGEMENT</h3>
                <div style={styles.headerActions}>
                  <HoverLink to="" baseStyle={styles.btnAddBlue} hoverStyle={styles.btnAddBlueHover}>Add</HoverLink>
                  <HoverButton baseStyle={styles.btnIcon} hoverStyle={styles.btnIconHover}><FaPlus /></HoverButton>
                </div>
              </div>
              <div style={styles.feesSummary}>
         {totals.loading ? (
        <div className="loading">Loading totals...</div>
      ) : totals.error ? (
        <div className="error">
          Error: {totals.error}
          <button onClick={handleRefresh}>Retry</button>
        </div>
      ) : (
       <div className="totals-grid" style={{ display: 'flex', gap: '20px', width: '100%' }}>
  <div className="total-card" style={{ flex: 1 }}>
    <div style={{ textAlign: 'left', margin: '20px 0', fontFamily: 'Arial, sans-serif', width: '100%' }}>
      {teacherCount !== null ? (
        <div style={styles.feesItem}>
          <span style={styles.feesItemLabel}>Total Teachers</span>
          <strong style={{ ...styles.feesItemAmount, ...styles.amountPaid }}>
            {teacherCount}
          </strong>
        </div>
      ) : (
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
          Loading teacher count...
        </p>
      )}
    </div>
  </div>

  <div className="total-card" style={{ flex: 1 }}>
        <div style={{ textAlign: 'left', margin: '20px 0', fontFamily: 'Arial, sans-serif', width: '100%' }}>

    <div style={styles.feesItem}>
      <span style={styles.feesItemLabel}>Total Non Teachers</span>
      <strong style={{ ...styles.feesItemAmount, ...styles.amountPaid }}>
        10
      </strong>
    </div>
  </div></div>
</div>

      )}
 
                {/* <div style={styles.feesItem}><span style={styles.feesItemLabel}>TOTAL PENDING</span><strong style={{ ...styles.feesItemAmount, ...styles.amountPending }}>₹ {totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div> */}
              </div>
              <div style={styles.feesActions}>
                <div style={styles.actionRow}>
                  <HoverButton
                    baseStyle={styles.btnLight}
                    hoverStyle={styles.btnLightHover}
                    // onClick={() => navigate('/generateBill')}
                    // onClick={handleSearch}
                  >
                    SEARCH
                  </HoverButton>
                  <HoverButton
                    baseStyle={styles.btnLight}
                    hoverStyle={styles.btnLightHover}
                    // onClick={() => navigate('/PaidAmountdemo')}
                  >
                    PAYMENTS
                  </HoverButton>
                <HoverButton
    baseStyle={styles.btnLight}
    hoverStyle={styles.btnLightHover}
    onClick={() => setIsSalaryPopupOpen(true)}
>
    PAY SLIP
</HoverButton>
 
{isSalaryPopupOpen && (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    }}>
        <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto'
        }}>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button onClick={() => setIsSalaryPopupOpen(false)}>X</button>
            </div>
            {/* <TeacherSalaryForPay /> */}
        </div>
    </div>
)}
                </div>
                {/* <div style={styles.actionRow}>
                  <HoverButton
                    baseStyle={styles.btnGreen}
                    hoverStyle={styles.btnGreenHover}
                    // onClick={() => navigate('/PaidAmount')}
                  >
                    GENERATE
                  </HoverButton>
                  <HoverButton
                    baseStyle={styles.btnYellow}
                    hoverStyle={styles.btnYellowHover}
                    // onClick={() => navigate('/reminder')}
                  >
                    REQUEST
                  </HoverButton>
                </div> */}
              </div>
            </div>
          </Card>
 
 
 
 
 
          {/* expenses */}
 
 
 
             <Card title="">
            <div style={styles.feesManageCard}>
              <div style={styles.feesManageHeader}>
                <h3 style={styles.cardSubHeader}>Expenses</h3>
                <div style={styles.headerActions}>
                  <HoverLink to="/FinancePage" baseStyle={styles.btnAddBlue} hoverStyle={styles.btnAddBlueHover}>Add</HoverLink>
                  <HoverButton baseStyle={styles.btnIcon} hoverStyle={styles.btnIconHover} onClick={() => navigate("/FinancePage")} ><FaPlus /></HoverButton>
                </div>
              </div>
              <div style={styles.feesSummary}>
         {totals.loading ? (
        <div className="loading">Loading totals...</div>
      ) : totals.error ? (
        <div className="error">
          Error: {totals.error}
          <button onClick={handleRefresh}>Retry</button>
        </div>
      ) : (
        <div className="totals-grid">
          <div className="total-card">
             <div style={styles.feesItem}><span style={styles.feesItemLabel}>TOTAL SPEND</span><strong style={{ ...styles.feesItemAmount, ...styles.amountPaid }}>₹{totals.totalPaid.toFixed(2)}</strong></div>
          </div>
         
     
        </div>
      )}
 
                {/* <div style={styles.feesItem}><span style={styles.feesItemLabel}>TOTAL PENDING</span><strong style={{ ...styles.feesItemAmount, ...styles.amountPending }}>₹ {totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div> */}
              </div>
              <div style={styles.feesActions}>
                <div style={styles.actionRow}>
                  <HoverButton
                    baseStyle={styles.btnLight}
                    hoverStyle={styles.btnLightHover}
                    // onClick={() => navigate('/generateBill')}
                    onClick={handleSearch}
                  >
                    SEARCH
                  </HoverButton>
                  <HoverButton
                    baseStyle={styles.btnLight}
                    hoverStyle={styles.btnLightHover}
                    // onClick={() => navigate('/PaidAmountdemo')}
                  >
                    PRINT
                  </HoverButton>
                  <HoverButton
                    baseStyle={styles.btnLight}
                    hoverStyle={styles.btnLightHover}
                    // onClick={() => navigate('/GenerateBill')}
                  >
                    EDIT
                  </HoverButton>
                </div>
                <div style={styles.actionRow}>
                  <HoverButton
                    baseStyle={styles.btnGreen}
                    hoverStyle={styles.btnGreenHover}
                    // onClick={() => navigate('/PaidAmount')}
                  >
                    GENERATE
                  </HoverButton>
                  <HoverButton
                    baseStyle={styles.btnYellow}
                    hoverStyle={styles.btnYellowHover}
                    onClick={() => setIsRequestFormOpen(true)}
                  >
                    REQUEST
                  </HoverButton>
                </div>
              </div>
            </div>
          </Card>
 
 
 
 
{/* here is popup component */}  
 
 
 
 
 
 
 
        </div>
 
        <div style={styles.dashboardColumn}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              REPORTS
            </h2>
          </div>       
          <Card title="">
            <div style={styles.feesReportCard}>
              <h3 style={styles.cardSubHeader}>FEES REPORT</h3>
              <div style={styles.reportFilters}>
               
 
 
 
<div
  style={{
    width: "100%",
    color: "#52667A",
    display: "flex",
    flexDirection: "column", // stack heading & inputs vertically
    alignItems: "flex-start",
    gap: "1rem", // space between heading & inputs
  }}
>
  <h1
    style={{
      fontSize: "1rem",
      fontWeight: "600",
      margin: 0,
    }}
  >
    Search by Class And Section
  </h1>
 
  {/* Row for both dropdowns */}
  <div
    style={{
      display: "flex",
      gap: "1rem", // space between two dropdowns
      width: "100%",
    }}
  > 
 
 
    {/* Class Dropdown */}
    <select
      value={selectedClasss}
      onChange={(e) => {
        setSelectedClasss(e.target.value);
        setSelectedSection("");
        setSelectedStudent(null);
      }}
      style={{
        flex: 1,
        padding: "0.6rem",
        borderRadius: "6px",
        border: "1px solid #9ca3af",
        fontSize: "1rem",
        backgroundColor: "#fff",
        color: "#000",
      }}
    >
      <option value="">Select Class</option>
      {["nursery", "lkg", "ukg", ...Array.from({ length: 10 }, (_, i) => `class${i + 1}`)].map(
        (cls) => (
          <option key={cls} value={cls}>
            {cls.toUpperCase()}
          </option>
        )
      )}
    </select>
 
    {/* Section Dropdown */}
    {selectedClasss && (
      <select
        value={selectedSection}
        onChange={(e) => {
          setSelectedSection(e.target.value);
          setSelectedStudent(null);
 
          if (e.target.value) {
            fetchDataBasedOnClassAndSection(selectedClasss, e.target.value);
          }
        }}
        style={{
          flex: 1,
          padding: "0.6rem",
          borderRadius: "6px",
          border: "1px solid #9ca3af",
          fontSize: "1rem",
          backgroundColor: "#fff",
          color: "#000",
        }}
      >
        <option value="">Select Section</option>
        {section.map((sec) => (
          <option key={sec} value={sec}>
            {sec.toUpperCase()}
          </option>
        ))}
      </select>
    )}
  </div>
</div>
 
              </div>
              <div style={styles.reportActions}>
                <HoverButton
                  baseStyle={styles.btnLight}
                  hoverStyle={styles.btnLightHover}
                  // onClick={() => navigate('/PaidStudents')}  
 
                  onClick={handlePaidLedger}
                >
                  PAID
                </HoverButton>
       <HoverButton
  baseStyle={styles.btnLight}
  hoverStyle={styles.btnLightHover}
  onClick={() => setIsUnpaidSalaryPopupOpen(true)}
>
  UNPAID
</HoverButton>
<HoverButton
  baseStyle={styles.btnLight}
  hoverStyle={styles.btnLightHover}
  onClick={handleOverallLedger}
>
  OVERALL
</HoverButton>
 
{isUnpaidSalaryPopupOpen && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }}>

 <style>
      {`
        #unpaid-students-content button {
          display: none !important;
        }
      `}
    </style>
    
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      width: '80%',
      maxWidth: '1000px',
      height: '90vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
        {/* Popup Header with Actions */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>UNPAID STUDENTS REPORT</h3>
            <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => handlePrint('unpaid-students-content')}
                    style={{ padding: '8px 16px', backgroundColor: '#5a7488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Print
                </button>
                <button
                    onClick={() => handleDownloadPdf('unpaid-students-content', 'fees-report-unpaid.pdf', 'Unpaid Students Report')}
                    style={{ padding: '8px 16px', backgroundColor: '#5a7488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Download
                </button>
                <button
                    onClick={() => setIsUnpaidSalaryPopupOpen(false)}
                    style={{ padding: '8px 16px', backgroundColor: '#000000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Close
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div id="unpaid-students-content" style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
          <UnpaidStudents fromDate={unpaidFilterFromDate} toDate={unpaidFilterToDate} />
        </div>
    </div>
  </div>
)}
             
              </div>
            </div>
          </Card>
          <Card title="OTHER INCOMES"><Placeholder>Content for other incomes goes here.</Placeholder></Card>
          <Card title="EXPENCES"><Placeholder>Content for expenses goes here.</Placeholder></Card>
        </div>
      </div>



{isRequestFormOpen && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1001
        }}>
            <div style={{
                backgroundColor: 'white', padding: '25px', borderRadius: '8px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)', width: '450px', maxWidth: '90%'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Submit Expense Request</h2>
                    <button onClick={handleViewRequests} style={{
                        padding: '8px 12px', borderRadius: '4px', border: '1px solid #007bff',
                        backgroundColor: '#f0f7ff', color: '#007bff', cursor: 'pointer'
                    }}>View Status</button>
                </div>

                <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="text"
                        name="expenseName"
                        value={requestFormData.expenseName}
                        onChange={handleRequestFormChange}
                        placeholder="Expense Name (e.g., Office Supplies)"
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                    />
                    <input
                        type="number"
                        name="amount"
                        value={requestFormData.amount}
                        onChange={handleRequestFormChange}
                        placeholder="Amount (₹)"
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                    />
                    <textarea
                        name="previous graduate"
                        value={requestFormData.previousGraduate}
                        onChange={handleRequestFormChange}
                        placeholder="Description of Expense"
                        required
                        rows="4"
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', resize: 'vertical' }}
                    ></textarea>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' }}>
                         <button type="button" onClick={() => setIsRequestFormOpen(false)} style={{
                            padding: '10px 20px', borderRadius: '4px', border: '1px solid #6c757d',
                            backgroundColor: '#6c757d', color: 'white', cursor: 'pointer', flex: 1
                        }}>Cancel</button>
                        <button type="submit" style={{
                            padding: '10px 20px', borderRadius: '4px', border: 'none',
                            backgroundColor: '#28a745', color: 'white', cursor: 'pointer', flex: 1
                        }}>Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
    )}

{isStatusPopupOpen && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1002
        }}>
            <div style={{
                backgroundColor: 'white', padding: '25px', borderRadius: '8px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)', width: '600px', maxWidth: '95%',
                maxHeight: '80vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0 }}>Previous Requests Status</h2>
                    <button onClick={() => setIsStatusPopupOpen(false)} style={{
                        background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
                    }}>×</button>
                </div>
                {isStatusLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
                ) : statusError ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#dc3545' }}>{statusError}</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Expense</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previousRequests.map(req => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                    <td style={{ padding: '12px' }}>{req.expense_name}</td>
                                    <td style={{ padding: '12px' }}>₹{parseFloat(req.amount).toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold',
                                        color: req.status === 'Approved' ? '#28a745' : req.status === 'Rejected' ? '#dc3545' : '#6c757d'
                                    }}>
                                        {req.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )}
 

{/* Ledger for all data  */}
{/* Paid Ledger Popup */}
{isPaidLedgerOpen && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      width: '100%',
      maxWidth: '1300px',
      height: '90vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Popup Header with Actions */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>PAID STUDENTS LEDGER</h3>
          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
              <button
                  onClick={() => handlePrint('paid-ledger-content')}
                  style={{ padding: '8px 16px', backgroundColor: '#5a7488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                  Print
              </button>
              <button
                  onClick={() => handleDownloadPdf('paid-ledger-content', 'fees-report-paid.pdf', 'Paid Students Ledger')}
                  style={{ padding: '8px 16px', backgroundColor: '#5a7488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                  Download
              </button>
              <button
                  onClick={() => setIsPaidLedgerOpen(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#000000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                  Close
              </button>
          </div>
      </div>
      
      {/* Main Content Area */}
      <div id="paid-ledger-content" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <img
              src={dynamicLogoSrc || "/default-logo.png"}
              alt="School Logo"
              style={{ height: '80px', width: 'auto' }}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0, color: 'black' }}>
                {dynamicSchoolCode.replace(/_/g, ' ')}
            </h1>
          </div>
          <div style={{width: '80px'}}></div>
        </div>

        <div>
          {/* <p><strong>Statement Date:</strong> From 2025-03-31 to 2026-03-30</p> */}
          <p><strong>Class:</strong> {selectedClasss} - <strong>Section:</strong> {selectedSection}</p>
        </div>

        <div className="no-print" style={{ margin: '15px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{fontWeight: 'bold'}}>From: <input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} style={{padding: '4px', border: '1px solid #ccc', borderRadius: '4px'}} /></label>
            <label style={{fontWeight: 'bold'}}>To: <input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} style={{padding: '4px', border: '1px solid #ccc', borderRadius: '4px'}}/></label>
            <button onClick={handleFeeFilter} style={{padding: '6px 12px', border: 'none', backgroundColor: '#2980B9', color: 'white', borderRadius: '4px', cursor: 'pointer'}}>Filter</button>
            <button onClick={clearFeeFilter} style={{padding: '6px 12px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333', borderRadius: '4px', cursor: 'pointer'}}>Reset</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(45, 62, 80, 1)', color: '#fff' }}>
                <th style={headerStyleD}>Receipt Number</th>
                <th style={headerStyleD}>Date</th>
                <th style={headerStyleD}>Type</th>
                <th style={headerStyleD}>Service Name</th>
                <th style={headerStyleD}>Student Name</th>
                <th style={headerStyleD}>Class & Section</th>
                <th style={headerStyleD}>Description</th>
                <th style={headerStyleD}>Payment Mode</th>
                <th style={headerStyleD}>Total Amount</th>
                <th style={headerStyleD}>Payment INR</th>
                <th style={headerStyleD}>Discount</th>
                <th style={headerStyleD}>Balance INR</th>
            </tr>
          </thead>
          <tbody>
            {feeData.fees.map((data, index) => (
              <tr key={index}>
                <td style={cellStyleD}>{data.id}</td>
                <td style={cellStyleD}>{new Date(data.date).toLocaleDateString()}</td>
                <td style={cellStyleD}>Fees</td>
                <td style={cellStyleD}>{data.fee_type ? data.fee_type :"-"}</td>
                <td style={cellStyleD}>{data.student_name}</td>
                <td style={cellStyleD}>{data.class_name}-{data.section}</td>
                <td style={cellStyleD}>{data.description}</td>
                <td style={cellStyleD}>-</td>
                <td style={cellStyleD}>
                  ₹{
                    (
                      parseFloat(classFeeMap[data.class_name] || 0) +
                      parseFloat(data.totalFee || 0)
                    ).toFixed(2)
                  }
                </td>
                <td style={cellStyleD}>₹{data.paidAmount?.toFixed(2)}</td>
                <td style={cellStyleD}>₹{data.discount?.toFixed(2)}</td>
                <td style={cellStyleD}>
                  ₹{
                    (
                      parseFloat(classFeeMap[data.class_name] || 0) +
                      parseFloat(data.totalFee || 0) -
                      parseFloat(data.paidAmount || 0) -
                      parseFloat(data.discount || 0)
                    ).toFixed(2)
                  }
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
              <td style={cellStyleD} colSpan={8}>Total</td>
              <td style={cellStyleD}>₹{totalFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td style={cellStyleD}></td>
              <td style={cellStyleD}></td>
              <td style={cellStyleD}>₹{totalFinalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
 
{/* Unpaid Ledger Popup */}
{isUnpaidLedgerOpen && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      width: '100%',
      maxWidth: '1500px',
      padding: '20px',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <img
            src={dynamicLogoSrc || "/default-logo.png"}
            alt="School Logo"
            className="header-logo"
            style={{
              height: '80px',
              width: 'auto',
              borderRadius: '1px',
              position: 'absolute',
              top: '20px',
              left: '20px',
            }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
     <h1 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0, color: 'black' }}>
                                {dynamicSchoolCode.replace(/_/g, ' ')}
                            </h1>          <h3 style={{ margin: '10px 0', borderBottom: '2px solid #5a7488', paddingBottom: '5px' }}>UNPAID STUDENTS LEDGER</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          {/* Optional content can go here */}
        </div>
      </div>
 
      <div>
        {/* <p><strong>Statement Date:</strong> From 2025-03-31 to 2026-03-30</p> */}
        <p><strong>Class:</strong> {selectedClasss} - <strong>Section:</strong> {selectedSection}</p>
      </div>
 
 
 
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr style={{ backgroundColor: '#5a7488', color: '#fff' }}>
      <th style={cellStyleD}>Student Name</th>
      <th style={cellStyleD}>Class and Section</th>
      <th style={cellStyleD}>Father Name</th>
      <th style={cellStyleD}>Mobile Number</th>
      <th style={cellStyleD}>Fee Type</th>
      <th style={cellStyleD}>Total Amount</th>
      <th style={cellStyleD}>Due Amount</th>
      <th style={cellStyleD}>Last Reminder</th>
    </tr>
  </thead>
  <tbody>
    {feeData.fees.map((data, index) => (
      <tr key={index}>
        <td style={cellStyleD}>{data.student_name}</td>
        <td style={cellStyleD}>{data.class_name}-{data.section}</td>
        <td style={cellStyleD}>{data.father_name}</td>
        <td style={cellStyleD}>{data.mobile_number}</td>
        <td style={cellStyleD}>{data.fee_type || "-"}</td>
               <td style={cellStyleD}>
  ₹{classFeeMap[data.class_name] 
      ? parseFloat(classFeeMap[data.class_name]).toFixed(2) 
      : '0.00'}
</td>           <td style={cellStyleD}>₹{(data.amount - (data.paidAmount + data.discount)).toFixed(2)}</td>
        <td style={cellStyleD}>-</td>
      </tr>
    ))}
    {/* Total Row */}
    <tr style={{ backgroundColor: '#fff', fontWeight: 'bold' }}>
      <td style={cellStyleD} colSpan={5}>Total</td>
      <td style={cellStyleD}>₹{feeData.fees.reduce((sum, fee) => sum + fee.amount, 0).toFixed(2)}</td>
      <td style={cellStyleD}>₹{feeData.fees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount - fee.discount), 0).toFixed(2)}</td>
      <td style={cellStyleD}></td>
    </tr>
  </tbody>
</table>
 
 
      <button
        onClick={() => setIsUnpaidLedgerOpen(false)}
        style={{
          marginTop: '20px',
          backgroundColor: '#000',
          color: '#fff',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          float: 'right',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
 
 
 
 
  {showPopupForSlip && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 9999,
          
          }}
          onClick={()=>{setShowPopupForSlip(false)}} // close if clicked outside the content
        >
          <div
            onClick={(e) => e.stopPropagation()} // prevent close if clicking inside
            style={{
             backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "95vw", // take 95% of the viewport width
    maxWidth: "1400px", // limit to a max width
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    position: "relative",
            }}
          >
            <button
              onClick={()=>{setShowPopupForSlip(false)}}
              style={{ position: "absolute", top: 10, right: 10, cursor: "pointer" }}
            >
              Close
            </button>
          {/* <TeacherSalaryForPay/> */}
          </div>
        </div>
      )}
 
 
{/* Ledger for class and section  */}
 
{isLedgerOpenForExpense && (
 <div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
 }}>
  <div style={{
   backgroundColor: '#fff',
   borderRadius: '8px',
   width: '100%',
   maxWidth: '1000px',
   padding: '20px',
   position: 'relative' // This is necessary for positioning the button
  }}>
   
   {/* This button is positioned at the top-right corner */}
   <button
    onClick={() => setIsLedgerOpenForExpense(false)}
    style={{
     position: 'absolute',
     top: '15px',
     right: '20px',
     background: 'transparent',
     border: 'none',
     fontSize: '1.8rem',
     lineHeight: '1',
     cursor: 'pointer',
     color: '#333'
    }}
   >
    &times;
   </button>

   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
     <img
      src={dynamicLogoSrc || "/default-logo.png"}
      alt="School Logo"
      className="header-logo"
      style={{
       height: '80px',
       width: 'auto',
       borderRadius: '1px',
       position: 'absolute',
       top: '20px',
       left: '20px',
      }}
     />
    </div>
    <div style={{ textAlign: 'center' }}>
     <h1 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0, color: 'black' }}>
      {dynamicSchoolCode.replace(/_/g, ' ')}
     </h1>
     <h3 style={{ margin: '10px 0', borderBottom: '2px solid #3b82f6', paddingBottom: '5px' }}>LEDGER</h3>
    </div>
    <div style={{ textAlign: 'right' }}>
     <div>
     </div>
    </div>
   </div>

<div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
    <label style={{ fontWeight: "bold" }}>
      From{" "}
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        style={{ padding: "4px 6px", borderRadius: "4px", border: "1px solid #888", fontSize: "14px" }}
      />
    </label>
    <label style={{ fontWeight: "bold" }}>
      To{" "}
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        style={{ padding: "4px 6px", borderRadius: "4px", border: "1px solid #888", fontSize: "14px" }}
      />
    </label>

    <button
      onClick={handleExpenseDateFilter}
      style={{
        padding: "6px 12px", borderRadius: "4px", border: "1px solid #007bff",
        backgroundColor: "#2980B9", color: "white", cursor: "pointer", fontSize: "14px"
      }}
    >
      Filter Data
    </button>
    <button
        onClick={clearExpenseDateFilter}
        style={{
            padding: '6px 12px', border: '1px solid #ccc', backgroundColor: '#f0f0f0',
            color: '#333', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
        }}
    >
        Reset
    </button>
</div>

   <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
    <table style={tableStylee}>
     <colgroup>
      {colWidths.map((width, i) => (
       <col key={i} style={{ width }} />
      ))}
     </colgroup>
     <thead>
  <tr>
    <th style={headerStyleDe}>Bill Number</th>
    <th style={headerStyleDe}>Date</th>
    <th style={headerStyleDe}>Type</th>
    <th style={headerStyleDe}>Description_name</th>
    <th style={headerStyleDe}>Payment Mode</th>
    <th style={headerStyleDe}>Total Amount</th>
    <th style={headerStyleDe}>Payment INR</th>
    <th style={headerStyleDe}>Balance INR</th>
    {/* ADD THIS NEW HEADER */}
    <th style={headerStyleDe}>Action</th> 
  </tr>
</thead>
    </table>

    <table style={tableStylee}>
     <colgroup>
      {colWidths.map((width, i) => (
       <col key={i} style={{ width }} />
      ))}
     </colgroup>
 <tbody>
  {userExpensesData && userExpensesData.map((data, index) => (
    <tr key={data.id || index}>
      <td style={cellStyleDe}>{index + 1}</td>
      <td style={cellStyleDe}>{new Date(data.expense_date).toLocaleDateString()}</td>
      <td style={cellStyleDe}>{data.expense_type}</td>
      <td style={cellStyleDe}>{data.description ? data.description : "N/A"}</td>
      <td style={cellStyleDe}>{data.payment_mode ? data.payment_mode : "-"}</td>
      <td style={cellStyleDe}>₹{data.price ? Number(data.price).toFixed(2) : '0.00'}</td>
      <td style={cellStyleDe}>₹ {data.paid_amount ? Number(data.paid_amount).toFixed(2) : '0.00'}</td>
      <td style={cellStyleDe}>₹{data.balance_amount ? Number(data.balance_amount).toFixed(2) : '0.00'}</td>
      {/* ADD THIS NEW TABLE CELL FOR THE ACTION BUTTON */}
      <td style={cellStyleDe}>
        {data.isUploadedBill && data.imageUrl && (
          <button
            onClick={() => openImageModal(data.imageUrl)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            View
          </button>
        )}
      </td>
    </tr>
  ))}

      {/* Total Row */}
      <tr
       style={{
        backgroundColor: '#e8f5e9',
        fontWeight: 'bold',
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
       }}
      >
       <td style={cellStyleDe} colSpan={4}>
        Total
       </td>
       <td style={cellStyleDe}></td>
       <td style={cellStyleDe}>
        ₹{totalExpenseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
       </td>
       <td style={cellStyleDe}></td>
       <td style={cellStyleDe}>
        ₹{totalFinalExpenseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
       </td>
      </tr>
     </tbody>
    </table>
   </div>
   {/* The old close button at the bottom has been removed */}
  </div>
 </div>
)}



{isLedgerOpen && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      width: '100%',
      maxWidth: '1300px',
      height: '90vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Popup Header with Actions */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>OVERALL FEES LEDGER</h3>
          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
              <button
                  onClick={() => handlePrint('overall-ledger-content')}
                  style={{ padding: '8px 16px', backgroundColor: '#5a7488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                  Print
              </button>
              <button
                  onClick={() => handleDownloadPdf('overall-ledger-content', 'fees-report-overall.pdf', 'Overall Fees Ledger')}
                  style={{ padding: '8px 16px', backgroundColor: '#5a7488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                  Download
              </button>
              <button
                  onClick={() => setIsLedgerOpen(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#000000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                  Close
              </button>
          </div>
      </div>
      
      {/* Main Content Area */}
      <div id="overall-ledger-content" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <img
              src={dynamicLogoSrc || "/default-logo.png"}
              alt="School Logo"
              style={{ height: '80px', width: 'auto' }}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0 }}>{dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL</h2>
            <h3 style={{ margin: '10px 0', borderBottom: '2px solid #3b82f6', paddingBottom: '5px' }}>LEDGER</h3>
          </div>
          <div style={{width: '80px'}}></div>
        </div>

        <div>
          {/* <p><strong>Statement Date:</strong> From 2025-07-21 to 2026-03-30</p> */}
          <p><strong>Ledger For:</strong> {ledgerValue}</p>
        </div>

        <div className="no-print" style={{ margin: '15px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{fontWeight: 'bold'}}>From: <input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} style={{padding: '4px', border: '1px solid #ccc', borderRadius: '4px'}} /></label>
            <label style={{fontWeight: 'bold'}}>To: <input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} style={{padding: '4px', border: '1px solid #ccc', borderRadius: '4px'}}/></label>
            <button onClick={handleFeeFilter} style={{padding: '6px 12px', border: 'none', backgroundColor: '#2980B9', color: 'white', borderRadius: '4px', cursor: 'pointer'}}>Filter</button>
            <button onClick={clearFeeFilter} style={{padding: '6px 12px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333', borderRadius: '4px', cursor: 'pointer'}}>Reset</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(45, 62, 80, 1)', color: '#fff' }}>
                <th style={headerStyleD}>Receipt Number</th>
                <th style={headerStyleD}>Date</th>
                <th style={headerStyleD}>Type</th>
                <th style={headerStyleD}>Service Name</th>
                <th style={headerStyleD}>Student Name</th>
                <th style={headerStyleD}>Class & Section</th>
                <th style={headerStyleD}>Description</th>
                <th style={headerStyleD}>Payment Mode</th>
                <th style={headerStyleD}>Total Amount</th>
                <th style={headerStyleD}>Payment INR</th>
                <th style={headerStyleD}>Discount</th>
                <th style={headerStyleD}>Balance INR</th>
            </tr>
          </thead>
          <tbody>
            {feeData.fees
              .filter(data => data.student_name != null)
              .map((data, index) => (
                <tr key={index}>
                  <td style={cellStyleD}>{data.id}</td>
                  <td style={cellStyleD}>{new Date(data.date).toLocaleDateString()}</td>
                  <td style={cellStyleD}>Fees</td>
                  <td style={cellStyleD}>{data.fee_type ? data.fee_type : "-"}</td>
                  <td style={cellStyleD}>{data.student_name}</td>
                  <td style={cellStyleD}>{data.class_name}-{data.section}</td>
                  <td style={cellStyleD}>{data.description}</td>
                  <td style={cellStyleD}>-</td>
                  <td style={cellStyleD}>
                    ₹{classFeeMap[data.class_name]
                      ? parseFloat(classFeeMap[data.class_name]).toFixed(2)
                      : '0.00'}
                  </td>
                  <td style={cellStyleD}>₹{data.paidAmount?.toFixed(2)}</td>
                  <td style={cellStyleD}>₹{data.discount?.toFixed(2)}</td>
                  <td style={cellStyleD}>₹{data.finalAmount?.toFixed(2)}</td>
                </tr>
              ))}
            <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
              <td style={cellStyleD} colSpan={8}>Total</td>
              <td style={cellStyleD}>₹{totalFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td style={cellStyleD}></td>
              <td style={cellStyleD}></td>
              <td style={cellStyleD}>₹{totalFinalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
{isLedgerOpenForClass && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '1000px',
      padding: '20px',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          
 
        <img
  src={dynamicLogoSrc || "/default-logo.png"}
  alt="School Logo"
  className="header-logo"
  style={{
    height: '80px',
    width: 'auto',
    borderRadius: '1px',
    position: 'absolute',
    top: '20px',
    left: '20px',
  }}
/>
        </div>
        <div style={{ textAlign: 'center' }}>
     <h1 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0, color: 'black' }}>
                                {dynamicSchoolCode.replace(/_/g, ' ')}
                            </h1>          {/* <p>K.T. Road, Tirupati</p> */}
          <h3 style={{ margin: '10px 0', borderBottom: '2px solid #3b82f6', paddingBottom: '5px' }}>LEDGER</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>
          
 
        <img
  src={dynamicLogoSrc || "/default-logo.png"}
  alt="School Logo"
  className="header-logo"
  style={{
    height: '80px',
    width: 'auto',
    borderRadius: '1px',
    position: 'absolute',
    top: '20px',
    right: '20px',
  }}
/>
 
          </div>
          {/* <p>Date: {new Date().toLocaleDateString()}</p> */}
        </div>
      </div>
 
      <div >
        <p><strong>Class:</strong>  {selectedClasss}</p>
          <p><strong>Section:</strong>  {selectedSection}</p>
        {/* <p><strong>Statement Date:</strong> From 2025-03-31 to 2026-03-30</p> */}
      </div>
 
      <table style={{
        width: '100%',
        marginTop: '1rem',
        borderCollapse: 'collapse',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}>
        <thead style={{ backgroundColor: '#1f2937', color: '#fff' }}>
          <tr>
            <th style={thStyle}>Receipt Number</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Type</th>
            {/* <th style={thStyle}>Service Name</th> */}
            <th style={thStyle}>Student Name </th>
            <th style={thStyle}>Class & Section</th>
            <th style={thStyle}>Payment Mode</th>
            <th style={thStyle}>Paid Amount</th>
            
            {/* <th style={thStyle}>Total Amount</th>
            <th style={thStyle}>Payment INR</th>
            <th style={thStyle}>Discount</th>
            <th style={thStyle}>Balance INR</th> */}
          </tr>
        </thead>
      <tbody>
  {studentFees.length === 0 ? (
    <tr style={{ backgroundColor: '#e6f4ea' }}>
      <td colSpan="7" style={{ textAlign: 'center', padding: '10px' }}>
        Total ₹0.00 — No Data Found
      </td>
    </tr>
  ) : (
    <>
      {studentFees.map((item, idx) => (
        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
          <td style={tdStyle}>{item.id || '-'}</td>
          <td style={tdStyle}>{new Date(item.created_at).toLocaleDateString()}</td>
          <td style={tdStyle}>{item.fee_type}</td>
          <td style={tdStyle}>{item.StudentName}</td>
          <td style={tdStyle}>{item.Class_name}{item.section}</td>
          <td style={tdStyle}>{item.paymentMode? item.paymentMode:"N/A"}</td>
          <td style={tdStyle}>{item.Paid_Amount ? `₹${item.Paid_Amount}` : 0}</td>
        </tr>
      ))}
 
      {/* ✅ Total Row */}
      {/* <tr style={{ backgroundColor: '#e6f4ea', fontWeight: 'bold' }}>
        <td colSpan="5" style={{ textAlign: 'right', padding: '10px' }}>Total</td>
         <td colSpan="1" style={{ textAlign: 'right', padding: '10px' }}></td>
        <td  style={{ padding: '10px' }}>₹{totalPaidAmount.toFixed(2)}</td>
      </tr> */}
 
<tr style={{ 
    backgroundColor: '#e8f5e9', 
    fontWeight: 'bold', 
    position: 'sticky', 
    bottom: 0, 
    zIndex: 2 
  }}>
  <td style={cellStyleD} colSpan={6}>Total</td>
  {/* <td style={cellStyleD}> ₹0.00 </td>
  <td style={cellStyleD}></td>
  <td style={cellStyleD}></td> */}
  <td style={cellStyleD}>₹{totalPaidAmount.toFixed(2)} </td>
</tr>
       
    </>
  )}
</tbody>
 
      </table>
 
      <button
        onClick={() => setIsLedgerOpenForClass(false)}
        style={{
          marginTop: '20px',
          backgroundColor: '#000',
          color: '#fff',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          float: 'right',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
  </div>
)}



{/* ADD THIS ENTIRE MODAL CODE BLOCK HERE */}
{selectedImage && (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 10000, backdropFilter: 'blur(4px)'
    }} onClick={closeImageModal}>
        <div style={{
            maxWidth: '90vw', maxHeight: '90vh',
            backgroundColor: '#fff', borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column'
        }} onClick={(e) => e.stopPropagation()}>
            <div style={{
                padding: '16px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', borderBottom: '1px solid #e5e7eb'
            }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>Bill Image</h3>
                <button onClick={closeImageModal} style={{
                    backgroundColor: 'transparent', border: 'none', color: '#6b7280',
                    cursor: 'pointer', fontSize: '1.5rem', lineHeight: '1'
                }}>×</button>
            </div>
            <div style={{
                padding: '20px', overflow: 'auto', display: 'flex',
                justifyContent: 'center', alignItems: 'center', flex: 1
            }}>
                <img
                    src={selectedImage}
                    style={{
                        maxWidth: '100%', maxHeight: 'calc(90vh - 120px)',
                        objectFit: 'contain', borderRadius: '4px'
                    }}
                    alt="Full size bill"
                />
            </div>
        </div>
    </div>
)}
{/* END OF NEW MODAL CODE BLOCK */}
 
 
    </>
  );
};
 
const Card = ({ title, children }) => (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <h2 style={styles.cardTitle}>{title}</h2>
    </div>
    <div>{children}</div>
  </div>
);
 
const Placeholder = ({ children }) => (
  <div style={styles.placeholderContent}>{children}</div>
);
 
const HoverButton = ({ baseStyle, hoverStyle, children, customStyle, onClick }) => {
  const [hover, setHover] = useState(false);
  const combinedStyle = { ...baseStyle, ...(hover ? hoverStyle : null), ...customStyle };
  return (
    <>
    <button 
      style={combinedStyle} 
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)} 
      onClick={onClick}
    >
      {children}
    </button>
    </>
  );
};
 
const HoverLink = ({ to, baseStyle, hoverStyle, children, customStyle }) => {
  const [hover, setHover] = useState(false);
  const combinedStyle = { ...baseStyle, ...(hover ? hoverStyle : null), ...customStyle };
  return (
    <Link 
      to={to} 
      style={combinedStyle} 
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
};
 
const styles = {
  appContainer: { 
    display: 'flex', 
    flexDirection: 'column',
    minHeight: '100vh'
  },
  mainContent: { 
    padding: '24px',
    marginTop: '100px',
    '@media (max-width: 768px)': {
      padding: '15px',
      marginTop: '80px'
    },
    '@media (max-width: 480px)': {
      padding: '10px',
      marginTop: '70px'
    }
  },
  header: {
    backgroundColor: '#fff',
    color: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    position: 'fixed',
    top: '0',
    width: '100%',
    zIndex: '50',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    '@media (max-width: 768px)': {
      padding: '0 1rem'
    }
  },
  headerLogo: {
    height: '80px',
    width: 'auto',
    borderRadius: '1px',
    position: 'absolute',
    left: '3rem',
    top: '50%',
    transform: 'translateY(-50%)',
    paddingLeft: '1rem',
    '@media (max-width: 768px)': {
      height: '50px',
      left: '1rem'
    },
    '@media (max-width: 480px)': {
      height: '40px',
      left: '0.5rem'
    }
  },
  headerWrapper: {
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    flex: 1,
    '@media (max-width: 768px)': {
      padding: '0.5rem'
    }
 
 
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: 0,
    whiteSpace: 'nowrap',
    color: 'black',
    '@media (max-width: 768px)': {
      fontSize: '1rem',
      padding: '0 0.5rem'
    },
    '@media (max-width: 480px)': {
      fontSize: '0.9rem'
    }
  },
  accountantHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    position: 'absolute',
    right: '2rem',
    '@media (max-width: 768px)': {
      gap: '0.5rem'
    }
  },
  dashboardGrid: { 
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '15px'
    }
  },
  dashboardColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    '@media (max-width: 768px)': {
      gap: '15px'
    }
  },
  sectionHeader: {
    textAlign: 'center', 
    marginBottom: '10px'
  },
   sectionTitle: {
    margin: 0,
    color: '#7C7BAD', // Use primary color for section titles
    fontSize: '17px',
    fontWeight: '700',
    '@media (max-width: 768px)': {
      fontSize: '15px'
    }
  },
  card: { 
    backgroundColor: '#ffffff', 
          borderLeft: '4px solid rgb(101 120 92)',
 
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)', 
    padding: '20px',
    flex: 1,
    '@media (max-width: 768px)': {
      padding: '15px'
    }
  },
  cardHeader: { 
    paddingBottom: '15px', 
    marginBottom: '15px' 
  },
  cardTitle: { 
    margin: 0, 
    fontSize: '15px', 
    color: '#595959', 
    fontWeight: 600, 
    textTransform: 'uppercase' 
  },
  placeholderContent: { 
    border: '1.5px dashed #d9d9d9', 
    borderRadius: '4px', 
    minHeight: '80px', 
    padding: '20px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    textAlign: 'center', 
    color: '#888' 
  },
  cardSubHeader: { 
    margin: 0, 
    fontSize: '15px', 
    fontWeight: 600, 
    color: '#333' 
  },
  feesManageCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  feesManageHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    
    marginBottom: '20px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '10px'
    }
  },
  headerActions: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px',
    '@media (max-width: 480px)': {
      width: '100%',
      justifyContent: 'space-between'
    }
  },
  feesSummary: { 
 display: 'flex',
    justifyContent: 'space-between', // This will push items to opposite sides
    width: '100%',
    margin: '10px 0',  },
  feesItem: { 
    display: 'flex',
    flexDirection: 'column', // Stack label and amount vertically
    alignItems: 'flex-start', // Align items to the left for left item
  },
    // For the right item, you might want to align it differently
  feesItemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end', // Align items to the right for right item
  },
    feesItemLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px', // Space between label and amount
  },
  feesItemAmount: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  feesItemLabel: { 
    fontSize: '14px', 
    color: '#555', 
    fontWeight: 500 
  },
    feesItemLabel1: { 
    fontSize: '10px', 
    color: '#555', 
    fontWeight: 500 
  },
  feesItemAmount: { 
    fontSize: '15px', 
    fontWeight: 700 
  },
    feesItemAmount1: { 
    fontSize: '10px', 
    fontWeight: 700 
  },
  amountPaid: {
    color: '#4CAF50', // Color from image tags
  },
  amountPending: {
    color: '#F6546A', // Color from image tags
  },
  feesActions: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px' 
  },
  actionRow: { 
    display: 'flex', 
    gap: '10px',
    '@media (max-width: 480px)': {
      flexDirection: 'column'
    }
  },
  feesReportCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  reportFilters: { 
    display: 'flex', 
    gap: '10px', 
    marginBottom: '15px',
    '@media (max-width: 480px)': {
      flexDirection: 'column'
    }
  },
  reportActions: { 
    display: 'flex', 
    gap: '10px',
    '@media (max-width: 480px)': {
      flexDirection: 'column'
    }
  },
  btnAddBlue: {
    padding: '6px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    textAlign: 'center',
    transition: 'background-color 0.2s, border-color 0.2s',
    fontSize: '14px',
    backgroundColor: '#7C7BAD',
    color: '#FFFFFF',
    border: '1px solid #7C7BAD',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: '1.5',
    '@media (max-width: 480px)': {
      width: '100%'
    }
  },
  btnAddBlueHover: {
    backgroundColor: '#5F5F9C',
    borderColor: '#5F5F9C'
  },
  btnLight: {
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    flex: 1,
    textAlign: 'center',
    transition: 'background-color 0.2s',
    fontSize: '14px',
    backgroundColor: '#3498DB',
    color: '#FFFFFF',
    border: '1px solid #3498DB',
    '@media (max-width: 480px)': {
      width: '100%'
    }
  },
  btnLightHover: {
    backgroundColor: '#2980B9'
  },
  btnGreen: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    flex: 1,
    textAlign: 'center',
    transition: 'background-color 0.2s',
    fontSize: '14px',
    backgroundColor: '#20C997',
    color: '#FFFFFF',
    border: '1px solid #20C997',
    '@media (max-width: 480px)': {
      width: '100%'
    }
  },
  btnGreenHover: {
    backgroundColor: '#17A589'
  },
  btnYellow: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    flex: 1,
    textAlign: 'center',
    transition: 'background-color 0.2s',
    fontSize: '14px',
    backgroundColor: '#FFC107',
    color: '#212529',
    border: '1px solid #FFC107',
    '@media (max-width: 480px)': {
      width: '100%'
    }
  },
  btnYellowHover: {
    backgroundColor: '#E0A800'
  },
  btnIcon: { 
    backgroundColor: '#5a7488', 
    color: 'white', 
    border: 'none', 
    width: '28px', 
    height: '28px', 
    borderRadius: '50%', 
    fontSize: '14px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    cursor: 'pointer', 
    transition: 'background-color 0.2s' 
  },
  btnIconHover: { 
    backgroundColor: '#5a7488' 
  },
  ledgerModal: {
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100vw', 
    height: '100vh', 
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999
  },
  ledgerModalContent: {
    backgroundColor: '#fff', 
    borderRadius: '8px', 
    width: '90%', 
    maxWidth: '1000px', 
    padding: '20px', 
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
    '@media (max-width: 768px)': {
      width: '95%',
      padding: '15px'
    }
  },
  ledgerHeader: {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '0 20px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '15px',
      padding: 0
    }
  },
  ledgerLogo: {
    height: '80px', 
    width: '80px', 
    objectFit: 'contain',
    '@media (max-width: 768px)': {
      height: '60px',
      width: '60px'
    }
  },
  ledgerTitle: {
    textAlign: 'center',
    '@media (max-width: 768px)': {
      order: -1
    }
  },
  ledgerInfo: {
    padding: '10px 20px', 
    marginTop: '10px', 
    borderTop: '1px solid #eee', 
    borderBottom: '1px solid #eee',
    '@media (max-width: 768px)': {
      padding: '10px 0'
    }
  },
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
    marginTop: '1rem'
  },
  ledgerTable: {
    width: '100%', 
    borderCollapse: 'collapse', 
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    minWidth: '600px'
  },
  tableHeader: {
    backgroundColor: '#1f2937', 
    color: '#fff'
  },
  closeButton: {
    marginTop: '20px', 
    backgroundColor: '#000', 
    color: '#fff', 
    padding: '10px 20px', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    float: 'right',
    '@media (max-width: 768px)': {
      width: '100%',
      float: 'none'
    }
  }
};
 
export default Interface;   