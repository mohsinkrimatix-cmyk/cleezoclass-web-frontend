import { CheckCircle, HeartOff, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useContext, useEffect } from 'react';
import jsPDF from 'jspdf';
import ReactDOM from 'react-dom';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Filter, FileText, Printer } from 'lucide-react';
import axios from 'axios';
 
const TeacherSalaryTable1 = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [finalAmount, setFinalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const dateInputRef = useRef(null);
  const contentRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [task, setTask] = useState("");
  const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
  const dashboardRef = useRef(null);
  const [employeeId, setEmployeeId] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState('');
  const [presentDays, setPresentDays] = useState(0);
  const [halfDays, setHalfDays] = useState(0);
  const [baseSalary, setBaseSalary] = useState('');
  const [totalSalary, setTotalSalary] = useState(null);
  const [salaryDate, setSalaryDate] = useState("");
  const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [deductions, setDeductions] = useState(0.00);
  const [bonuses, setBonuses] = useState(0.00);
  const [salaryMonth, setSalaryMonth] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [institutionData, setInstitutionData] = useState(null);
  const [logo, setLogo] = useState(null);
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState([]);
  const [showModal, setShowModal] = useState()
  const [isEditing, setIsEditing] = useState(false);
  const [editableBill, setEditableBill] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [paymentMode, setPaymentMode] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [salaryData, setSalaryData] = useState([])
  const [monthlySalaryData, setMonthlySalaryData] = useState([])
  const [showPrintPopup, setShowPrintPopup] = useState(false);
  const [copyCount, setCopyCount] = useState(1);
  const [paidLeaves, setPaidLeaves] = useState();
  const [url, setUrl] = useState()
  const [unPaidLeaves, setUnpaidLeaves] = useState()
  const [autoGeneratePayslip, setAutoGeneratePayslip] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({ name: '', school_name: '', email: "" });
const [allAttendanceData, setAllAttendanceData] = useState([]);
 
  // New state variables for late hour deductions
  const [lateHoursPerMonth, setLateHoursPerMonth] = useState(0);
  const [totalExcuseHours, setTotalExcuseHours] = useState(0);
  const [deductionOption, setDeductionOption] = useState('none'); // 'none', 'halfDay', 'fullDay'
  const [halfDayDeductionInput, setHalfDayDeductionInput] = useState(0);
  const [fullDayDeductionInput, setFullDayDeductionInput] = useState(0);
 
 
  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    salary_amount: '',
    salary_type: '',
    effective_from: '',
    status: 'pending',
  });
  const isMobile = window.innerWidth < 768;
 
 
 
  const slipRef = useRef();
 
  const handlePrint = () => {
    window.print();
  };
 
 
 
  const generatePDFBlobpdf = async (slipElement, name, monthName) => {
    if (!slipElement) return;
 
    const canvas = await html2canvas(slipElement);
    const imgData = canvas.toDataURL('image/png');
 
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
 
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
 
    const pdfBlob = pdf.output('blob');
 
    return pdfBlob;
  };
 
 
 
  const fetchBaseSalaryById = async (employeeId, schoolCode) => {
    const url = `https://cleezoclass.com:4000/api/salary/${employeeId}?schoolCode=${encodeURIComponent(schoolCode)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  };
 
  const fetchAttendanceById = async (employeeId, schoolCode) => {
    const url = `https://cleezoclass.com:4000/api/payroll/${employeeId}?schoolCode=${encodeURIComponent(schoolCode)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('No attendance found');
    return data;
  };
 
  const fetchEmployeeDetails = async (employeeId, schoolCode) => {
    const response = await fetch(`https://cleezoclass.com:4000/api/getEmployeeData`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolCode, employeeId })
    });
    if (!response.ok) throw new Error('Failed to fetch employee data');
    return await response.json();
  };
 
 
const handleMonthlyPayslipUpload = async () => {
  const currentMonth = new Date().getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[currentMonth];
  const schoolCode = localStorage.getItem("schoolCode");
  console.log("Monthly Upload Payslip Data");
  console.log(teacherData);
 
  for (const teacher of teacherData) {
    const { id: employeeId, name, email } = teacher;
    try {
      const baseSalaryData = await fetchBaseSalaryById(employeeId, schoolCode);
      const attendanceData = await fetchAttendanceById(employeeId, schoolCode);
      const employeeDetails = await fetchEmployeeDetails(employeeId, schoolCode);
      const presentCount = attendanceData.filter(d => d.status === 'Present').length;
 
      console.log(baseSalaryData);
      console.log(attendanceData);
      console.log(employeeDetails);
 
      // Extract employee details
      const { name: empName, school_name, email: empEmail } = employeeDetails?.data || {};
      setEmployeeInfo({ name: empName || '', school_name: school_name || '', email: empEmail || "" });
 
      // Calculate Net Salary: Base Salary - (HRA + PF + Professional Tax + Mediclaim + Deduction)
      const netSalary = parseFloat(baseSalaryData.salary_amount) - (
        parseFloat(baseSalaryData.hra) +
        parseFloat(baseSalaryData.pf) +
        parseFloat(baseSalaryData.professional_tax) +
        parseFloat(baseSalaryData.mediclaim) +
        parseFloat(baseSalaryData.deduction)
      );
 
      // Set monthly salary data
      setMonthlySalaryData({
        base_salary: baseSalaryData.salary_amount,
        hra: baseSalaryData.hra,
        pf: baseSalaryData.pf,
        professional_tax: baseSalaryData.professional_tax,
        mediclaim: baseSalaryData.mediclaim,
        deductions: baseSalaryData.deduction,
        final_salary: netSalary,
        status: baseSalaryData.status,
        salary_type: baseSalaryData.salary_type,
      });
 
      setSalaryMonth(monthName);
      setAutoGeneratePayslip(true);
 
      // Wait for the component to render
      await new Promise(resolve => setTimeout(resolve, 1000));
 
      // Generate PDF blob
      const blob = await generateCompressedPDFBlob(slipRef.current, name, monthName);
      console.log("PDF Blob generated successfully");
 
      // Prepare form data for email
      const formData_new = new FormData();
      formData_new.append("pdf", blob, `${name}_${monthName}_payslip.pdf`);
      formData_new.append("name", name);
      formData_new.append("email", email);
 
      // Send payslip via email
      await handleMailPayslipSend(formData_new);
 
      // Clean up
      setAutoGeneratePayslip(false);
      console.log(`Payslip processed and sent to ${name} (${email})`);
    } catch (err) {
      console.error(`Error for ${name}:`, err.message);
    }
  }
};
 
 
 
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // remove base64 prefix
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
 
 
  async function generateCompressedPDFBlob(element, name, monthName) {
    const canvas = await html2canvas(element, {
      scale: 1, // Reduce scale for smaller image
      useCORS: true,
    });
 
    const imgData = canvas.toDataURL("image/jpeg", 0.6); // 0.6 = 60% quality
    const pdf = new jsPDF("p", "mm", "a4", true); // true = compress PDF
 
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
 
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
 
    return pdf.output("blob"); // You can also use "arraybuffer"
  }
 
 
  const handleUploadsToCloudinary = async (slipDOM, email, name, month) => {
    console.log("Running Cloudinary upload for:", email);
 
    if (!slipDOM) {
      console.log("Slip DOM not found");
      return;
    }
 
    const originalBoxShadow = slipDOM.style.boxShadow;
    slipDOM.style.boxShadow = 'none';
 
    const canvas = await html2canvas(slipDOM, {
      scale: window.devicePixelRatio * 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
 
    const imgData = canvas.toDataURL('image/jpeg', 0.7);
 
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 148.5],
    });
 
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
 
    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    const imgHeight = pdfWidth / imgRatio;
    const yOffset = (pdfHeight - imgHeight) / 2;
 
    pdf.addImage(imgData, 'JPEG', 0, yOffset, pdfWidth, imgHeight);
    const pdfBlob = pdf.output('blob');
 
    const formData = new FormData();
    formData.append('file', pdfBlob);
    formData.append('upload_preset', 'my_unsigned_preset');
    console.log(formData)
 
    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/det3aoore/auto/upload', {
        method: 'POST',
        body: formData,
      });
 
      const data = await response.json();
 
      if (data.secure_url) {
        console.log('✅ Cloudinary PDF URL:', data.secure_url);
        handleMailPayslipSend(data.secure_url, email, name, month);
      } else {
        console.error('❌ Upload failed:', data);
      }
    } catch (error) {
      console.error('❌ Error uploading to Cloudinary:', error);
    }
 
    slipDOM.style.boxShadow = originalBoxShadow;
  };
 
 
 
  function startMonthlyUpload(targetHour, targetMinute, callback, teacherData) {
    let hasRunThisMonth = false;
 
    const interval = setInterval(() => {
      const now = new Date();
      const day = now.getDate();        // 1 to 31
      const hour = now.getHours();      // 0 to 23
      const minute = now.getMinutes();  // 0 to 59
 
      console.log(`⏰ Checking: ${day}-${hour}:${minute}`);
 
      // ✅ Only run on the 1st of each month at target time
      if (day === 1 && hour === targetHour && minute === targetMinute) {
        if (!hasRunThisMonth) {
          if (teacherData && teacherData.length > 0) {
            console.log("🎯 Conditions met. Uploading monthly payslip...");
            callback();
            hasRunThisMonth = true;
          } else {
            console.warn("⛔ teacherData is empty. Skipping upload.");
          }
        }
      }
 
      // ✅ Reset on the next day (2nd of the month)
      if (day !== 1) {
        hasRunThisMonth = false;
      }
 
    }, 30000); // check every 30 seconds
 
    return () => clearInterval(interval);
  }
 
 
  useEffect(() => {
    if (teacherData && teacherData.length > 0) {
      const stop = startMonthlyUpload(10, 30, handleMonthlyPayslipUpload, teacherData); // runs on 1st at 10:30
      return () => stop(); // clear interval on cleanup
    } else {
      console.log("⛔ Skipping monthly upload scheduler due to empty teacherData.");
    }
  }, [teacherData]);
 
 
 
 
 
  const handleMailPayslipSend = async (formData_new, email, name, month) => {
    console.log(email, name);
 
    try {
      const res = await fetch("https://cleezoclass.com:4000/api/sendpaySlip", {
        method: "POST",
 
        body: formData_new,
      });
 
      if (!res.ok) {
        throw new Error(res.statusText);
      } else {
        const data = await res.json();
        console.log("Payslip sent successfully:", data);
      }
    } catch (err) {
      console.log("Error sending payslip:", err.message);
    }
  };
 
 
 
 
  const instanceId = "instance135300"; // from dashboard
  const token = "nsjfwxfllmkq5c4y"; // from dashboard
 
 
 
  // SEND MESSAGE USING WHATSAPP
  async function sendPayslip(phoneNumber, pdfUrl) {
    try {
      const response = await axios.post(`https://api.ultramsg.com/${instanceId}/messages/document`, {
        token: token,
        to: phoneNumber, // format: "91xxxxxxxxxx"
        filename: "Payslip.pdf",
        document: pdfUrl,
        caption: "Hello! Here's your monthly payslip. 📄"
      });
 
      console.log("Message sent:", response.data);
    } catch (error) {
      console.error("Error sending:", error.response?.data || error.message);
    }
  }
 
 
 
  const handleDownloadNew = async () => {
    if (!slipRef.current) return;
 
    // Temporarily remove shadow to avoid blur effects
    const originalBoxShadow = slipRef.current.style.boxShadow;
    slipRef.current.style.boxShadow = 'none';
 
 
    // Increase scale for sharper image
    const canvas = await html2canvas(slipRef.current, {
      scale: window.devicePixelRatio * 2, // High-res capture
      useCORS: true,
      backgroundColor: '#ffffff',
    });
 
 
 
 
 
 
    const imgData = canvas.toDataURL('image/png');
 
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 148.5], // Half A4
    });
 
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
 
    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    const imgHeight = pdfWidth / imgRatio;
 
    const yOffset = (pdfHeight - imgHeight) / 2;
 
    pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, imgHeight);
 
    // Restore shadow after export
    slipRef.current.style.boxShadow = originalBoxShadow;
 
    pdf.save('Teacher_Payslip.pdf');
  };
 
 
 
 
  const handleUploadToCloudinary = async () => {
    console.log("handelUpload fucntion running")
    if (!slipRef.current) {
      console.log("slipref.current not found")
      return;
    }
 
    // Remove box shadow for clarity
    const originalBoxShadow = slipRef.current.style.boxShadow;
    slipRef.current.style.boxShadow = 'none';
 
    // Lower canvas scale to reduce resolution and size
    const canvas = await html2canvas(slipRef.current, {
      scale: window.devicePixelRatio * 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
 
    // Convert to JPEG and reduce quality to 70%
    const imgData = canvas.toDataURL('image/jpeg', 0.7);
 
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 148.5],
    });
 
 
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
 
    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    const imgHeight = pdfWidth / imgRatio;
    const yOffset = (pdfHeight - imgHeight) / 2;
 
    pdf.addImage(imgData, 'JPEG', 0, yOffset, pdfWidth, imgHeight); // use JPEG instead of PNG
 
    const pdfBlob = pdf.output('blob');
 
    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', pdfBlob);
    formData.append('upload_preset', 'my_unsigned_preset'); // use your preset name
    // formData.append('cloud_name', 'det3aoore');
 
    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/det3aoore/auto/upload', {
        method: 'POST',
        body: { formData },
      });
 
      const data = await response.json();
 
      if (data.secure_url) {
        console.log('✅ Cloudinary PDF URL:', data.secure_url);
 
 
 
        handleMailPayslipSend(data.secure_url)
        // sendPayslip(9307173845,data.secure_url)
        // Use the secure_url as needed (WhatsApp, download, etc.)
      } else {
        console.error('❌ Upload failed:', data);
      }
    } catch (error) {
      console.error('❌ Error uploading to Cloudinary:', error);
    }
 
    // Restore shadow
    slipRef.current.style.boxShadow = originalBoxShadow;
  };
 
  function getTodayFormatted() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');       // 2 digits
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = today.getFullYear();
 
    return `${day}-${month}-${year}`;
  }
 
 
 
 
  const getEmployeeData = async () => {
    const schoolCode = localStorage.getItem("schoolCode")
    try {
      const response = await fetch("https://cleezoclass.com:4000/getEmployeeData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          schoolCode: schoolCode,
          employeeId: employeeId
        })
      });
 
      if (!response.ok) {
        throw new Error(response.statusText);
      }
 
      const data = await response.json();
      console.log(data);
    } catch (err) {
      console.log(err.message);
    }
  };
 
 
 
const handleMonthlyData = async (value) => {
  setSalaryMonth(value);
  if (!allAttendanceData || allAttendanceData.length === 0) {
    return;
  }
 
  // Filter the allAttendanceData by the selected month
  const currentYear = new Date().getFullYear();
  const selectedMonthIndex = new Date(`${value} 1, ${currentYear}`).getMonth();
  const filteredData = allAttendanceData.filter((attendance) => {
    const attendanceDate = new Date(attendance.date);
    return (
      attendanceDate.getFullYear() === currentYear &&
      attendanceDate.getMonth() === selectedMonthIndex
    );
  });
  setAttendanceData(filteredData);
 
  // Recalculate present/half days and late hours for the filtered data
  let presentCount = 0;
  let halfDayCount = 0;
  let totalLateMinutes = 0;
  const standardStartTime = new Date("1970-01-01T09:00:00");
  filteredData.forEach((attendance) => {
    if (attendance.status === "present") {
      presentCount++;
      const timeIn = new Date(`1970-01-01T${attendance.entry_time}`);
      const timeOut = attendance.exit_time
        ? new Date(`1970-01-01T${attendance.exit_time}`)
        : null;
      if (!timeOut) {
        return;
      }
      const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);
      if (hoursWorked < 5) {
        halfDayCount++;
      }
      if (timeIn > standardStartTime) {
        const lateTimeDiff = timeIn.getTime() - standardStartTime.getTime();
        totalLateMinutes += lateTimeDiff / (1000 * 60);
      }
    }
  });
  setPresentDays(presentCount);
  setHalfDays(halfDayCount);
  setLateHoursPerMonth(totalLateMinutes / 60);
 
  // Calculate total leaves for the selected month
  const totalWorkDays = new Date(currentYear, selectedMonthIndex + 1, 0).getDate();
  const totalLeaves = totalWorkDays - presentCount;
  setUnpaidLeaves(totalLeaves);
 
  // Calculate salary for the selected month
  calculateSalaryForMonth(filteredData, presentCount, halfDayCount, totalLeaves);
 
  // --- Fetch monthly salary data from the backend ---
  const schoolCode = localStorage.getItem("schoolCode");
  try {
    const res = await fetch("https://cleezoclass.com:4000/getMonthlyData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolCode,
        salaryMonth: value,
        employeeId,
      }),
    });
    if (!res.ok) {
      throw new Error(res.statusText);
    } else {
      const data = await res.json();
      console.log("Backend Response:", data);
      if (data.success && data.data && data.data.latestSalary) {
        const latest = data.data.latestSalary;
        // Calculate Net Salary: Base Salary - (HRA + PF + Professional Tax + Mediclaim + Deduction)
        const netSalary = parseFloat(data.data.baseSalary) - (
          parseFloat(latest.hra) +
          parseFloat(latest.pf) +
          parseFloat(latest.professional_tax) +
          parseFloat(latest.mediclaim) +
          parseFloat(latest.deduction)
        );
        // Map backend fields to your frontend state structure
        setMonthlySalaryData({
          base_salary: data.data.baseSalary || 0,
          hra: latest.hra || 0,
          pf: latest.pf || 0,
          professional_tax: latest.professional_tax || 0,
          mediclaim: latest.mediclaim || 0,
          deductions: latest.deduction || 0,
          final_salary: netSalary, // Net Salary = Base Salary - (HRA + PF + Professional Tax + Mediclaim + Deduction)
          status: latest.status,
          salary_type: latest.salary_type,
        });
      } else {
        setMonthlySalaryData({});
      }
    }
  } catch (err) {
    console.log("Error fetching salary data:", err.message);
  }
};
 
 
 
const calculateSalaryForMonth = (filteredData, presentCount, halfDayCount, totalLeaves) => {
  if (!baseSalary) return;
 
  const totalWorkDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailySalary = parseFloat(baseSalary) / totalWorkDays;
  const halfDaySalary = dailySalary / 2;
 
  // Calculate deductions based on unpaid leaves and half days
  const deductedLeaves = totalLeaves - (paidLeaves || 0);
  const totalDeductionsAmount = (deductedLeaves * dailySalary) + (halfDayCount * halfDaySalary);
 
  // Calculate Net Salary: Base Salary - (HRA + PF + Professional Tax + Mediclaim + Deduction)
  const netSalary = parseFloat(baseSalary) - (
    parseFloat(monthlySalaryData.hra) +
    parseFloat(monthlySalaryData.pf) +
    parseFloat(monthlySalaryData.professional_tax) +
    parseFloat(monthlySalaryData.mediclaim) +
    parseFloat(monthlySalaryData.deductions)
  );
 
  setTotalSalary(netSalary);
  setDeductions(totalDeductionsAmount);
};
 
 
 
 
 
 
 
  const handleEditChange = (field, value) => {
    setEditableBill(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };
 
 
  const handleOpen = () => setShowModal(true);
 
  const handleClose = () => setShowModal(false);
  const convertAmountToWords = (num) => {
    if (isNaN(num)) return 'Invalid amount';
    if (num === 0) return 'Zero Rupees Only';
 
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const denominations = ['', 'Thousand', 'Lakh', 'Crore'];
 
    const getWords = (n) => {
      let word = '';
 
      if (n > 99) {
        word += single[Math.floor(n / 100)] + ' Hundred ';
        n = n % 100;
      }
 
      if (n > 19) {
        word += tens[Math.floor(n / 10)] + ' ';
        word += single[n % 10] + ' ';
      } else if (n >= 10) {
        word += double[n - 10] + ' ';
      } else if (n > 0) {
        word += single[n] + ' ';
      }
 
      return word.trim();
    };
 
    let rupees = Math.floor(num);
    let paise = Math.round((num - rupees) * 100);
 
    let str = '';
    const parts = [];
 
    const units = [
      rupees % 1000,
      Math.floor((rupees % 100000) / 1000),
      Math.floor((rupees % 10000000) / 100000),
      Math.floor(rupees / 10000000)
    ];
 
    for (let i = units.length - 1; i >= 0; i--) {
      if (units[i] !== 0) {
        parts.push(getWords(units[i]) + (denominations[i] ? ' ' + denominations[i] : ''));
      }
    }
 
 
    if (parts.length > 0) {
      str += parts.join(' ') + ' Rupees';
    }
 
    if (paise > 0) {
      str += (str ? ' and ' : '') + getWords(paise) + ' Paise';
    }
 
    return str.trim() + ' Only';
  };
 
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
  const resetAttendanceData = () => {
    setAttendanceData([]);
    setPresentDays(0);
    setHalfDays(0);
    setTotalSalary(null);
    setError('');
    setLateHoursPerMonth(0); // Reset new state
    setTotalExcuseHours(0); // Reset new state
    setDeductionOption('none'); // Reset new state
    setHalfDayDeductionInput(0); // Reset new state
    setFullDayDeductionInput(0); // Reset new state
  };
  const schoolData = {
    'bluebells': {
      //   logo: logo3,
      name: 'BLUEBELLS SCHOOL'
    },
    'sree_geethanjali_em': {
      //   logo: logo2,
      name: 'SREE GEETHANJALI EM'
    },
    'sree_geethanjali_em_school': {
      //   logo: logo2,
      name: 'SREE GEETHANJALI EM SCHOOL'
    },
    'ideal_lead_school': {
      //   logo: logo4,
      name: 'IDEAL LEAD SCHOOL'
    },
 
    'default': {
      //   logo: logo1,
      name: 'SREE GEETHANJALI SCHOOL'
    }
  };
 
  const handlePaySlip = () => {
    handleOpen()
 
  }
  const handleNameChange = (e) => {
    const selectedName = e.target.value;
    const selectedTeacher = teacherData.find((teacher) => teacher.name === selectedName);
    if (selectedTeacher) {
      setFormData({
        name: selectedName,
        teacher_id: selectedTeacher.id,
      });
      setEmployeeId(selectedTeacher.id);
    }
  };
 
  const handleIdChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedTeacher = teacherData.find((teacher) => teacher.id === selectedId);
    if (selectedTeacher) {
      setFormData({
        teacher_id: selectedId,
        name: selectedTeacher.name,
      });
      setEmployeeId(selectedId);
       setSalaryMonth(""); 
    }
  };
 
  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode');
    console.log('=== FETCH TEACHERS START ===');
    console.log('Raw schoolCode from localStorage:', schoolCode);
    console.log('Type of schoolCode:', typeof schoolCode);
 
    if (!schoolCode) {
      console.error('School code missing in localStorage');
      setTeacherData([]);
      return;
    }
 
    const cleanedSchoolCode = String(schoolCode).trim();
    console.log('Cleaned schoolCode:', cleanedSchoolCode);
    console.log('Cleaned schoolCode length:', cleanedSchoolCode.length);
    console.log('Cleaned schoolCode char codes:', Array.from(cleanedSchoolCode).map(c => c.charCodeAt(0)));
 
    if (!/^[a-zA-Z0-9_]+$/.test(cleanedSchoolCode)) {
      console.error('Invalid schoolCode format:', cleanedSchoolCode);
      return;
    }
 
    const encodedSchoolCode = encodeURIComponent(cleanedSchoolCode);
    const apiUrl = `https://cleezoclass.com:4000/api/teach?schoolCode=${encodedSchoolCode}`;
 
    console.log('Final API URL:', apiUrl);
 
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Received teacher data:', data);
        setTeacherData(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Error fetching teacher data:', error);
        setTeacherData([]);
      });
  }, []);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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
  };
 
  const handleDownload = async () => {
    const input = dashboardRef.current;
    if (!input) return;
 
    const originalStyle = {
      height: input.style.height,
      overflow: input.style.overflow,
    };
    const fullHeight = input.scrollHeight;
    input.style.height = fullHeight + 'px';
    input.style.overflow = 'visible';
 
    await new Promise(resolve => setTimeout(resolve, 300));
 
    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        width: input.scrollWidth,
        height: input.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
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
      pdf.save('WarmLeads.pdf');
    } catch (error) {
      console.error('Error generating full PDF:', error);
    } finally {
      input.style.height = originalStyle.height;
      input.style.overflow = originalStyle.overflow;
    }
  };
 
  const [activeContent, setActiveContent] = useState(null);
  const handleInputChange = (e) => {
    setEmployeeId(e.target.value);
  };
 
  const openCalendar = () => {
    dateInputRef.current?.showPicker();
  };
 
  const handleContainerClick = (content) => {
    setActiveContent(content);
  };
 
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };
 
  const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], 'Warmleads.pdf', { type: 'application/pdf' });
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
 
  const handlePrintCopies = (copies) => {
    const copiesPerPage = 2;
    const totalPages = Math.ceil(copies / copiesPerPage);
 
    const printWindow = window.open('', 'PRINT', 'heigh=820,width=595');
 
    let htmlContent = `
    <html>
      <head>
        <title>Print Payslips</title>
        <style>
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0;
            }
            #printable {
              width: 100%;
              max-width: 794px; /* A4 width in pixels */
              margin: auto;
              overflow: hidden;
              zoom: 0.85; /* Optional: scale down slightly */
            }
            button {
              display: none !important; /* Hide buttons in print */
            }
            .page {
              page-break-after: always;
              width: 250mm;
              height: 420mm;
              box-sizing: border-box;
              padding: 5mm;
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              align-content: space-between;
            }
 
            .copy {
              width: 49%;
              height: 49%;
              box-sizing: border-box;
              border: 1px solid black;
              font-family: Arial, sans-serif;
              font-size: 12px;
              padding: 10px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              transform: scale(1.05); /* Slightly scale up to fill space */
              transform-origin: top left;
            }
          }
        </style>
      </head>
      <body>
  `;
 
    for (let page = 0; page < totalPages; page++) {
      htmlContent += `<div class="page">`;
 
      for (let i = 0; i < copiesPerPage; i++) {
        const copyIndex = page * copiesPerPage + i;
        if (copyIndex >= copies) break;
 
        htmlContent += `
        <div class="copy">
          ${slipRef.current.innerHTML}
        </div>
      `;
      }
 
      htmlContent += `</div>`;
    }
 
    htmlContent += `
      <script>
        window.onload = () => {
          window.print();
          window.close();
        };
      </script>
      </body>
    </html>
  `;
 
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
  const popupStyles = {
    width: '300px',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0px 0px 10px rgba(0,0,0,0.2)',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000
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
    boxShadow: isHovered ? "0 12px 24px rgba(81,170,156,0.5)" : "0 6px 18px rgba(81,170,156,0.3)",
    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
  });
 
  const checkIconStyle = {
    color: "#ffffff",
  };
 
  const handleBackClick = () => {
    navigate('/RecruitmentDashboard');
  };
 
  useEffect(() => {
    const data = localStorage.getItem('institutionData');
    if (data) {
      const parsedData = JSON.parse(data);
      setInstitutionData(parsedData);
      fetchLogo(parsedData.id);
    }
  }, []);
 
  const fetchLogo = (institutionId) => {
    fetch(`https://cleezoclass.com:4000/api/get-logo/${institutionId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error fetching logo');
        }
        return response.json();
      })
      .then((data) => {
        setLogo(data.logo);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
 
  const handleLogoClick = () => {
    navigate(`/RecruitmentDashboard`);
  };
 
 
  const fetchBaseSalary = () => {
    console.log('[DEBUG] fetchBaseSalary started');
    setError('');
    setTotalSalary(null);
    if (!employeeId) {
      console.warn('[WARN] Invalid Employee ID:', employeeId);
      setError('Please enter a valid Employee ID.');
      return;
    }
    const schoolCode = localStorage.getItem('schoolCode') || '';
    console.log('[DEBUG] Retrieved schoolCode from localStorage:', schoolCode);
    if (!schoolCode) {
      console.warn('[WARN] Missing schoolCode');
      setError('School code is missing. Please select a school.');
      return;
    }
    const url = `https://cleezoclass.com:4000/api/salary/${employeeId}?schoolCode=${encodeURIComponent(schoolCode)}`;
    console.log('[DEBUG] Fetch URL:', url);
    fetch(url)
      .then((response) => {
        console.log('[DEBUG] Fetch response status:', response.status);
        return response.json();
      })
      .then((data) => {
        console.log('[DEBUG] Fetch response data:', data);
        if (data.error) {
          console.warn('[WARN] API returned error:', data.error);
          setError(data.error);
        } else {
          console.log(data)
          setSalaryData(data)
          const baseSalary = data.salary_amount ? parseFloat(data.salary_amount) : 0;
          console.log('[DEBUG] Setting baseSalary:', baseSalary);
          setBaseSalary(baseSalary);
        }
      })
      .catch((error) => {
        console.error('[ERROR] Error fetching salary data:', error);
        setError('Error fetching salary data. Please try again.');
      });
  };
 
 
 
 
const fetchAttendance = () => {
  setError('');
  setPresentDays(0);
  setHalfDays(0);
  setTotalSalary(null);
  setLateHoursPerMonth(0);
  if (!employeeId) {
    setError('Please enter a valid Employee ID.');
    return;
  }
  const schoolCode = localStorage.getItem('schoolCode') || '';
  if (!schoolCode) {
    setError('School code is missing. Please select a school.');
    return;
  }
  fetch(`https://cleezoclass.com:4000/api/payroll/${employeeId}?schoolCode=${encodeURIComponent(schoolCode)}`)
    .then((response) => response.json())
    .then((data) => {
      if (!Array.isArray(data)) {
        setError('Error: No attendance records found for this employee ID.');
        return;
      }
      if (data.length === 0) {
        setError('No attendance records found for this ID.');
      } else {
        setAllAttendanceData(data); // Store all data
        setAttendanceData(data); // Initially, show all data
        // Calculate present/half days and late hours for all data
        let presentCount = 0;
        let halfDayCount = 0;
        let totalLateMinutes = 0;
        const standardStartTime = new Date('1970-01-01T09:00:00');
        data.forEach((attendance) => {
          if (attendance.status === 'present') {
            presentCount++;
            const timeIn = new Date(`1970-01-01T${attendance.entry_time}`);
            const timeOut = attendance.exit_time ? new Date(`1970-01-01T${attendance.exit_time}`) : null;
            if (!timeOut) {
              return;
            }
            const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);
            if (hoursWorked < 5) {
              halfDayCount++;
            }
            if (timeIn > standardStartTime) {
              const lateTimeDiff = timeIn.getTime() - standardStartTime.getTime();
              totalLateMinutes += lateTimeDiff / (1000 * 60);
            }
          }
        });
        setPresentDays(presentCount);
        setHalfDays(halfDayCount);
        setLateHoursPerMonth(totalLateMinutes / 60);
      }
    })
    .catch((error) => {
      setError('Error fetching attendance data. Please try again.');
      console.error('Error:', error);
    });
};
 
 
 
 
const netPayInWords = monthlySalaryData.final_salary
  ? convertAmountToWords(monthlySalaryData.final_salary)
  : '0';
 
 
 
  const calculateNewSalary = () => {
 
    if (!attendanceData || attendanceData.length <= 0) {
      return alert("Please Select an Employee.");
    }
    if (!paidLeaves) {
      return alert("Please Enter Paid Leaves.");
    }
 
    const rawDate = attendanceData[0].date;
 
    // Safely convert rawDate to Date object
    const data = new Date(rawDate);
 
    // Check if the conversion worked
    if (isNaN(data.getTime())) {
      console.error("Invalid date format:", rawDate);
      return;
    }
 
    const month = data.getMonth() + 1; // JavaScript months are 0-indexed
    const year = data.getFullYear();
 
    // Get actual number of days in the month
    const totalWorkDays = new Date(year, month, 0).getDate();
 
    const dailySalary = parseFloat(baseSalary) / totalWorkDays;
    const halfDaySalary = dailySalary / 2;
 
    let totalLeaves = totalWorkDays - presentDays;
    let deductedLeaves = totalLeaves - paidLeaves; // Leaves to be deducted based on paid leaves
 
    let additionalHalfDays = 0;
    let additionalFullDays = 0;
 
    // Calculate remaining late hours after excuse hours (A)
    let remainingLateHours = Math.max(0, lateHoursPerMonth - totalExcuseHours);
if (deductionOption === 'halfDay') {
      // B: Half Day deduction after excuse hours (A)
      // Assuming a half-day is 4 hours for deduction purposes
      const hoursPerHalfDay = halfDayDeductionInput;
      
      // If the user provided an input for B, use that if it's less than or equal to calculated
      if (hoursPerHalfDay > 0) {
        additionalHalfDays = Math.ceil(remainingLateHours / hoursPerHalfDay);
      }
    } else if (deductionOption === 'fullDay') {
      // C: Full Day deduction after excuse hours (A)
      // Assuming a full-day is 8 hours for deduction purposes
      const hoursPerFullDay = fullDayDeductionInput;
      
      // If the user provided an input for C, use that if it's less than or equal to calculated
      if (fullDayDeductionInput > 0) {
        additionalFullDays = Math.ceil(remainingLateHours / hoursPerFullDay);
      }
    }
 
    // Add additional half-days to existing half-day count
    let finalHalfDayCount = halfDays + additionalHalfDays;
 
    // Add additional full-days to deducted leaves (these are now unpaid full days)
    deductedLeaves += additionalFullDays;
 
    // Calculate total deductions amount including half-days and full-days
    let totalDeductionsAmount = (deductedLeaves * dailySalary) + (finalHalfDayCount * halfDaySalary);
 
    const totalSalaryAmount = baseSalary - totalDeductionsAmount;
 
    setTotalSalary(totalSalaryAmount);
    setDeductions(totalDeductionsAmount); // Update deductions state for display if needed
  };
 
  const saveSalary = () => {
    if (!totalSalary) {
      setError('Please calculate salary before saving.');
      return;
    }
    const schoolCode = localStorage.getItem('schoolCode') || '';
    if (!schoolCode) {
      setError('School code is missing. Please select a school.');
      return;
    }
    if (!salaryMonth) {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      setSalaryMonth(currentMonth);
    }
    setIsLoading(true);
    fetch('https://cleezoclass.com:4000/api/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode,
        teacher_id: employeeId,
        base_salary: baseSalary,
        deductions: deductions,
        bonuses: bonuses,
        final_salary: totalSalary,
        salary_month: salaryMonth,
        status: 'paid',
     payment_date: salaryDate || new Date().toISOString().split('T')[0]
 
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setIsLoading(false);
        if (data.message === 'Salary details saved successfully.') {
          alert('Salary saved successfully!');
        } else {
          setError(data.message || 'Failed to save salary.');
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error('Error saving salary:', error);
        setError('Error saving salary. Please try again.');
      });
  };
 
 const handleSearch = () => {
  resetAttendanceData();
  fetchBaseSalary();
  fetchAttendance(); // This will fetch all data, not filtered by month
  getEmployeeData();
};
 
 
  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    backgroundColor: '#fff',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  };
 
  const leftContainer = {
    display: 'flex',
    alignItems: 'center',
  };
 
  const rightContainer = {
    display: 'flex',
    alignItems: 'center',
  };
 
  const logoStyle = {
    width: '100px',
    height: '100px',
    objectFit: 'contain',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 0
  };
 
  const userIconStyle = {
    fontSize: '24px',
    cursor: 'pointer',
    color: '#333',
  };
 
  const linkStyle = {
    margin: "0 10px",
    textDecoration: "none",
    display: "flex",
    alignItems: "center"
  };
 
  const inputStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ccc'
  };
 
  const buttonStyle = {
    padding: isMobile ? '9px 11px' : '10px 20px',
    fontSize: isMobile ? '14px' : '16px',
    backgroundColor: '#5A7488',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    flex: 1
  };
 
  const thStyle = {
    padding: '10px',
    border: '1px solid #ccc'
  };
 
  const tdStyle = {
    padding: '10px',
    border: '1px solid #ccc'
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
 
  return (
    <>
   
      <div className="outer-container1">
        <aside className="sidebar">
          <div className="logo"></div>
          <nav className="nav-icons">
            {['superadmin', 'director', 'management', 'Teacher', 'Admin'].includes(userRole) ? (
              <Link to="/homepage3" style={linkStyle}>
                <i className="fa fa-graduation-cap" title="Operations" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-graduation-cap" title="Operations (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'director', 'Admin', 'management', 'Admission Counsellor'].includes(userRole) ? (
              <Link to="/marketing" style={linkStyle}>
                <i className="fa fa-id-card" title="Admissions" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-id-card" title="Admissions (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'director', 'management', 'accountant'].includes(userRole) ? (
              <Link to="/AccountantDashboard" style={linkStyle}>
                <i className="fa fa-calculator" title="Commerce" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-calculator" title="Commerce (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'director', 'management', 'Admin'].includes(userRole) ? (
              <Link to="/services" style={linkStyle}>
                <i className="fa fa-tasks" title="School Services" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-tasks" title="School Services (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'management', 'Admin'].includes(userRole) ? (
              <Link to="/SupportTeamCategories" style={linkStyle}>
                <i className="fa fa-users" title="Support" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-users" title="Support (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'director', 'management', 'Admin'].includes(userRole) ? (
              <Link to="/settings" style={linkStyle}>
                <i className="fa fa-cog" title="Settings" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-cog" title="Settings (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
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
          <div ref={dashboardRef}>

            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '30px',
              marginTop: "20px",
              backgroundColor: '#f9f9f9',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontFamily: 'Arial, sans-serif'
            }}>
              <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Attendance Details</h1>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="teacher_name" style={{ fontWeight: 'bold' }}>Employee Name:</label>
                  <select
                    id="teacher_name"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                    style={{ padding: '8px', borderRadius: '5px', width: '100%' }}
                  >
                    <option value="">Select Employee Name</option>
                    {teacherData.map((teacher) => (
                      <option key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="teacher_id" style={{ fontWeight: 'bold' }}>Employee ID:</label>
                  <select
                    id="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleIdChange}
                    required
                    style={{ padding: '8px', borderRadius: '5px', width: '100%' }}
                  >
                    <option value="">Select Employee ID</option>
                    {teacherData.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={handleSearch} style={buttonStyle}>Search</button>
                </div>
              </div>
              <div id="responsiveContainer" style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
           <style>
  {`
    @media (max-width: 768px) {
      /* This is the top filter section with Name, ID, Search */
      div[style*="display: flex"][style*="gap: 15px"] {
          flex-direction: column;
      }

      /* Main container for the two content columns */
      #responsiveContainer {
        flex-direction: column !important;
      }

      /* Target the two columns (Attendance and Salary Details) */
      #responsiveContainer > div {
        width: 100% !important;
        flex: 1 1 100% !important; /* Force to take full width */
        min-width: 0; /* Allow shrinking */
      }

      /* Ensure the table can scroll horizontally within its wrapper */
      #responsiveTableWrapper {
        overflow-x: auto !important;
      }
      
      /* Stack the radio button options for deductions */
      label[for="totalExcuseHours"] + input + div > div {
        flex-direction: column !important;
        gap: 10px !important;
      }
      
      /* Stack the Leaves and Calculate/Save buttons */
      div[style*="justify-content: center"][style*="gap: 10px"] {
        flex-direction: column !important;
        align-items: stretch !important;
      }

      /* Override the fixed width on the 'Total Leaves' container */
      div[style*="width: 190px"] {
          width: 100% !important;
          padding: 0 !important;
      }
      
      /* --- Responsive Payslip Modal (No changes from before, kept for completeness) --- */
      #printable {
          width: 100% !important; box-sizing: border-box !important; padding: 15px !important; font-size: 12px !important;
      }
      #printable h2 {
          font-size: 1.2rem !important; text-align: center;
      }
      #printable h4 {
          font-size: 1rem !important;
      }
      #printable table {
          font-size: 12px !important;
      }
      #printable img {
          height: 60px !important; width: 60px !important; object-fit: contain;
      }
      #printable > div:first-child > div:first-child {
          flex-direction: column !important; align-items: center !important; gap: 10px;
      }
      #printable > div:first-child > div:first-child > div {
          text-align: center !important;
      }
      #printable div[style*="justify-content: space-between"][style*="margin-top: 40px"] {
          flex-direction: column !important; align-items: center !important; gap: 30px !important; margin-top: 30px !important;
      }
    }
  `}
</style>
 
                <div style={{ flex: 1 }}>
                  {attendanceData.length >= 0 && (
                    <div>
                      <h4>Attendance Summary</h4>
                      <div style={{
                        backgroundColor: '#e0ffe0',
                        padding: '15px',
                        borderRadius: '5px',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <h4 style={{ margin: '0 20px 0 0' }}>Total Present Days: {presentDays}</h4>
                        <h4 style={{ margin: 0 }}>Total Half Days: {halfDays}</h4>
                      </div>
                      <div id="responsiveTableWrapper" style={{ overflowX: 'auto' }}>
                        <table
                          id="responsiveTable"
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginTop: '20px',
                            minWidth: '600px' // ensure scroll on mobile
                          }}
                        >
 
                       <thead>
  <tr style={{ backgroundColor: '#485864ff', color: 'white' }}>
    <th style={thStyle}>Attendance ID</th>
    <th style={thStyle}>Name</th>
    <th style={thStyle}>Date</th>
    <th style={thStyle}>Status</th>
    <th style={thStyle}>Time In</th>
    <th style={thStyle}>Time Out</th>
  </tr>
</thead>
<tbody>
  {attendanceData.map((attendance, index) => (
    <tr
      key={attendance.id}
      style={{
        textAlign: 'center',
        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f2f2f2',
      }}
    >
      <td style={tdStyle}>{attendance.id}</td>
      <td style={tdStyle}>{attendance.username}</td>
      <td style={tdStyle}>
        {new Date(attendance.date).toLocaleDateString()} {/* format date */}
      </td>
      <td style={tdStyle}>{attendance.status}</td>
      <td style={tdStyle}>{attendance.entry_time || '-'}</td>
      <td style={tdStyle}>{attendance.exit_time || '-'}</td>
    </tr>
  ))}
</tbody>
 
 
                        </table>
 
                      </div> </div>
                  )}
                </div>
 
                <div style={{ flex: 1 }}>
                  {baseSalary !== '' && (
                    <div>
                      <h4>Salary Details</h4>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#e8f0ff',
                        padding: '15px',
                        borderRadius: '5px',
                        marginBottom: '20px'
                      }}>
                        <div>
                          <h4 style={{ margin: 0 }}>Base Salary: ₹{baseSalary}</h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <label htmlFor="salaryMonth" style={{ marginRight: '5px' }}>Select Month:</label>
                          <select
                            id="salaryMonth"
                            value={salaryMonth}
                            onChange={(e) => { handleMonthlyData(e.target.value) }}
                            style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                          >
                            <option value="">Select Month</option>
                            {[
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ].map(month => <option key={month} value={month}>{month}</option>)}
                          </select>
                        </div>
                      </div>
 
                      {/* New Section for Late Hour Deductions */}
                      <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Late Hour Deductions</h4>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>
                          Total Late Hours per Month: <strong>{lateHoursPerMonth.toFixed(2)} hours</strong>
                        </p>
                        <label htmlFor="totalExcuseHours" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                          A: Total Excuse Hours per Month:
                        </label>
                        <input
                          type="number"
                          id="totalExcuseHours"
                          value={totalExcuseHours}
                          onChange={(e) => setTotalExcuseHours(parseFloat(e.target.value) || 0)}
                          style={{ padding: '8px', borderRadius: '5px', width: '100%', marginBottom: '10px', border: '1px solid #ccc' }}
                          min="0"
                        />
 
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Select Deduction Option:</label>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div>
                              <input
                                type="radio"
                                id="halfDayDeduction"
                                name="deductionOption"
                                value="halfDay"
                                checked={deductionOption === 'halfDay'}
                                onChange={(e) => setDeductionOption(e.target.value)}
                                style={{ marginRight: '5px' }}
                              />
                              <label htmlFor="halfDayDeduction">B: Half Day deduction after excuse hours (A)</label>
                            </div>
                            <div>
                              <input
                                type="radio"
                                id="fullDayDeduction"
                                name="deductionOption"
                                value="fullDay"
                                checked={deductionOption === 'fullDay'}
                                onChange={(e) => setDeductionOption(e.target.value)}
                                style={{ marginRight: '5px' }}
                              />
                              <label htmlFor="fullDayDeduction">C: Full Day deduction after excuse hours (A)</label>
                            </div>
                          </div>
                        </div>
 
                        {deductionOption === 'halfDay' && (
                          <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="halfDayDeductionInput" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                              B: Half Day Deduction Input (hours):
                            </label>
                            <input
                              type="number"
                              id="halfDayDeductionInput"
                              value={halfDayDeductionInput}
                              onChange={(e) => setHalfDayDeductionInput(parseFloat(e.target.value) || 0)}
                              style={{ padding: '8px', borderRadius: '5px', width: '100%', border: '1px solid #ccc' }}
                              min="0"
                            />
                          </div>
                        )}
 
                        {deductionOption === 'fullDay' && (
                          <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="fullDayDeductionInput" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                              C: Full Day Deduction Input (hours):
                            </label>
                            <input
                              type="number"
                              id="fullDayDeductionInput"
                              value={fullDayDeductionInput}
                              onChange={(e) => setFullDayDeductionInput(parseFloat(e.target.value) || 0)}
                              style={{ padding: '8px', borderRadius: '5px', width: '100%', border: '1px solid #ccc' }}
                              min="0"
                            />
                          </div>
                        )}
                      </div>
                      {/* End New Section for Late Hour Deductions */}
 
                      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
 
                        <div style={{
                          padding: '10px 25px',
                          borderRadius: '2px',
 
                          border: 'none',
                          color: 'white',
 
                          width: '190px'
 
                        }}>
 
 
                          <span style={{
                            width: "100%",
                            padding: "6px",
                            marginBottom: "15px",
                            fontSize: "16px",
                            textAlign: "center",
                            border: "2px solid #6c63ff",
                            borderRadius: "10px",
                            outline: "none",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.3s ease-in-out",
                            backgroundColor: "#f8f9fa",
                            color: "#333"
                          }}>Total Leaves : <strong>{presentDays >= 1 ? 30 - presentDays : 0}</strong></span>
                          <input style={{
                            marginTop: "10px",
                            width: "100%",
                            padding: "2px",
                            marginBottom: "15px",
                            fontSize: "16px",
                            textAlign: "center",
                            border: "2px solid #6c63ff",
                            borderRadius: "10px",
                            outline: "none",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.3s ease-in-out",
                            backgroundColor: "#f8f9fa",
                            color: "#333"
                          }} placeholder="Paid Leaves" value={paidLeaves} onChange={(e) => setPaidLeaves(e.target.value)} />
 
 
                        </div>
                      <button
  onClick={calculateNewSalary}
  disabled={!salaryMonth}
  title={!salaryMonth ? "Please select a month first" : ""} // Tooltip
  style={{
    padding: '10px 25px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: !salaryMonth ? '#cccccc' : '#5A7488',
    color: 'white',
    cursor: !salaryMonth ? 'not-allowed' : 'pointer',
    width: 'fit-content',
    height: "40px"
  }}
>
  Calculate Salary
</button>
 
                        <button
                          onClick={saveSalary}
                          style={{
                            padding: '10px 25px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: '#5A7488',
                            color: 'white',
                            cursor: 'pointer',
                            width: 'fit-content', // Fixed width for the button,
                            height: "40px"
                          }}
                        >
                          Save Salary
                        </button>
 
 
 
                      </div>
 
                      {salaryMonth ?
                        <button onClick={handlePaySlip} style={{
                          padding: '10px 25px',
                          borderRadius: '5px',
                          border: 'none',
 
                          backgroundColor: '#5A7488',
                          marginLeft: "30px",
                          color: 'white',
                          cursor: 'pointer',
                          width: 'fit-content', // Fixed width for the button,
                          height: "40px",
                          marginBottom: "40px"
                        }}>Pay Slip </button> : ""
                      }
 
                      <div>
 
 
 
 
                      </div>
 
 
 
 
 
 
 
                      {error && <p style={{ color: 'red', fontWeight: 'bold', marginBottom: '15px' }}>{error}</p>}
                      {totalSalary !== null && (
                        <div style={{
                          backgroundColor: '#e8f0ff',
                          padding: '15px',
                          borderRadius: '5px',
                          marginBottom: '20px'
                        }}>
                          <h3>Total Salary: ₹{totalSalary.toFixed(2)}</h3>
                        </div>
                      )}
                    </div>
                  )}
                </div>
 
 
                {showModal && (
                  <div style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      //    border:"2px solid black",
                      //   borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      padding: '1.5rem',
                      width: '90%',
                      maxWidth: '900px',
                      height: '90vh',
                      overflowY: 'auto',
                      position: 'relative',
 
 
 
 
 
 
 
                    }}>
                      {/* Close Button */}
                      <button onClick={() => setShowModal(false)} style={{
                        position: 'absolute',
                        top: '1rem', padding: '0.5rem 1rem',
                        right: '1rem', color: 'white',
                          backgroundColor: '#ce3737ff',
                        borderRadius: '0.5rem',
                        cursor: 'pointer', fontSize: '0.875rem',transition: 'all 0.3s ease-in-out',
                      }}>
                        Close
                      </button>
 
                      {/* Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem'
                      }}>
                    
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* onClick={() => setShowPrintPopup(true)} */}
                          {/* <button  onClick={handlePrint} style={{ */}
 
 
                          <button
                            style={{
                              backgroundColor: '#5a7488',         // Vibrant green
                              padding: '0.5rem 1rem',
                              // backgroundColor: '#2563eb',
                              color: 'white',
                              borderRadius: '0.5rem',
                              border: 'none',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease-in-out',
                            }}
                            onClick={handleUploadToCloudinary}
                          >
                            📤 Send
                          </button>

 
 
 
 
                          <button onClick={() => setShowPrintPopup(true)} style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#5a7488',
                            color: 'white',
                            borderRadius: '0.5rem',
                            border: 'none',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}>
                            <Printer size={16} style={{ marginRight: '0.5rem' }} />
                            Print
                          </button>
                          <button
 
                            onClick={handleDownloadNew}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#5a7488',
                              color: 'white',
                              borderRadius: '0.5rem',
                              border: 'none',
                              fontSize: '0.875rem',
                              cursor: 'pointer'
                            }}>
                            <Download size={16} style={{ marginRight: '0.5rem' }} />
                            Download
                          </button>
                        </div>
                      </div>
 
                      {/* Payslip Content */}
 
                      <div style={{ height: "100vh" }}>
 
                        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
 
                          <div ref={slipRef} id="printable" style={{
                            width: '700px',
                            margin: 'auto',
                            padding: '20px',
                            border: '1px solid black',
                            backgroundColor: '#fff',
                            color: '#000'
                          }}>
                            {/* Header */}
<div style={{ textAlign: 'center', marginBottom: '20px' }}>
  <div style={{ display: "flex",  alignItems: "center", width: "100%" }}>
    <div style={{ flex: 1, textAlign: "left" }}>
      <img
        src={dynamicLogoSrc || "/default-logo.png"}
        alt="School Logo"
        style={{
          height: '80px',
          width: 'auto',
          borderRadius: '1px',
        }}
      />
    </div>
    <div style={{ flex: 1, textAlign: "center", marginRight:'10px' }}>
      <h2 style={{ margin: 0 }}>{schoolCode.toUpperCase()}</h2>
    </div>
  </div>
  <hr style={{ height: '3px', backgroundColor: 'black', border: 'none' }} />
  <h4 style={{ margin: 0 }}>Salary Receipt</h4>
  <p style={{ marginTop: "7px" }}>Month: {salaryMonth} 2025</p>
</div>

 
 
 
                            {/* Teacher Info */}
                            <table style={{ width: '100%', marginBottom: '20px' }}>
                              <tbody>
                                <tr>
                                  <td><strong>Receipt No:</strong>451</td>
                                  {/* <td><strong>Employee ID:</strong> T-{employeeId}</td> */}
                                  <td><strong>Date: </strong>{getTodayFormatted()}</td>
                                </tr>
                                {/* <tr>
              <td><strong>Teacher Name:</strong>{formData.name}</td>
              <td><strong>Employee ID:</strong> T-{employeeId}</td>
            </tr> */}
                                <tr>
                                  <td><strong>Teacher Name:</strong>{formData.name}</td>
                                  <td><strong>Department:</strong> High School</td>
                                </tr>
                                <tr>
                                  {/* <td><strong>Joining Date:</strong> 10-06-2021</td> */}
                                  {/* <td><strong>Bank A/C No:</strong> XXXX-XXXX-1234</td> */}
                                </tr>
                                <tr>
 
 
                                  {/* <td><strong>PAN No:</strong> ABCDE1234F</td> */}
                                  {/* <td><strong>UAN No:</strong> 100200300400</td> */}
                                  <td><strong>Status:</strong> {salaryData.status}</td>
                                  <td><strong>Salary Type:</strong> {salaryData.salary_type
                                  }</td>
                                  {/* <td><strong>Deductions:</strong> {deductions}</td> */}
                                </tr>
                              </tbody>
                            </table>
 
                            {/* Salary Details */}
<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
  <thead>
    <tr>
      <th style={{ border: '1px solid black', padding: '8px', textAlign: "center" }}>Earnings</th>
      <th style={{ border: '1px solid black', padding: '8px', textAlign: "center" }}>Amount (INR)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none" }}>Basic Pay</td>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none" }}>{monthlySalaryData.base_salary || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderTop: "none", borderBottom: "none" }}>HRA</td>
      <td style={{ border: '1px solid black', padding: '8px', borderTop: "none", borderBottom: "none" }}>{monthlySalaryData.hra || 0}</td>
    </tr>
  <tr>
  <td style={{ border: '1px solid black', padding: '8px', borderTop: "none", borderBottom: "none" }}>Mediclaim</td>
  <td style={{ border: '1px solid black', padding: '8px', borderTop: "none", borderBottom: "none" }}>{monthlySalaryData.mediclaim || 0}</td>
</tr>
 
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none", }}>PF</td>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none" , borderTop: "none",}}>{monthlySalaryData.pf || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none" }}>Professional Tax</td>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none" }}>{monthlySalaryData.professional_tax || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none" }}>Donation Deduction</td>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none" }}>{monthlySalaryData.deductions || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', fontWeight: "bold" }}><strong>Net Salary</strong></td>
      <td style={{ border: '1px solid black', padding: '8px', fontWeight: "bold" }}><strong>₹ {monthlySalaryData.final_salary || 0}</strong></td>
    </tr>
  </tbody>
</table>
 
 
 
 
 
 
                            {/* Net Pay */}
                            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                              {/* <h3>Net Pay: ₹ {monthlySalaryData.final_salary}</h3> */}
                              <p><em>(In words: ₹ {netPayInWords.charAt(0).toUpperCase() + netPayInWords.slice(1)} only)</em></p>
 
                            </div>
 
                            {/* Signatures */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                              <div style={{ textAlign: 'center' }}>
                                <hr style={{ width: '200px' }} />
                                <p>Teacher Signature</p>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <hr style={{ width: '200px' }} />
                                <p>Authorized Signature</p>
                              </div>
                            </div>
 
 
                            {/* Footer */}
                            <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '30px' }}>
                              <p>This is a computer generated payslip and does not require a signature.</p>
                            </div>
                          </div>
                        </div>
                      </div>
 
 
                      {/* Amount in words */}
 
 
 
                      {/* Placeholder Footer */}
 
                    </div>
                  </div>
 
 
                )}
 
                {/* {showPrintPopup && (
  <div style={popupStyles}>
    <h3>Select Number of Copies (max 4 per page):</h3>
    <input 
      type="number" 
      min="1" max="44" 
      value={copyCount} 
      onChange={(e) => {
        let val = Math.min(44, Math.max(1, Number(e.target.value)));
        setCopyCount(val);
      }} 
    />
    <button onClick={() => {
      setShowPrintPopup(false);
      handlePrintCopies(copyCount);
    }}>Print Now</button>
    <button onClick={() => setShowPrintPopup(false)}>Cancel</button>
  </div>
)} */}
 
 
 
 
                {showPrintPopup && (
                  <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                  }}>
                    <div style={{
                      backgroundColor: '#fff',
                      padding: '30px 25px',
                      borderRadius: '12px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                      width: '350px',
                      textAlign: 'center',
                      fontFamily: 'Segoe UI, sans-serif'
                    }}>
                      <h3 style={{ marginBottom: '15px', color: '#333' }}>
                        Select Number of Copies <br /> <span style={{ fontSize: '14px' }}>(max 4 per page)</span>
                      </h3>
 
                      <input
                        type="number"
                        min="1"
                        max="44"
                        value={copyCount}
                        onChange={(e) => {
                          let val = Math.min(44, Math.max(1, Number(e.target.value)));
                          setCopyCount(val);
                        }}
                        style={{
                          padding: '10px',
                          width: '80%',
                          marginBottom: '20px',
                          borderRadius: '6px',
                          border: '1px solid #ccc',
                          fontSize: '16px'
                        }}
                      />
 
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button
                          onClick={() => {
                            setShowPrintPopup(false);
                            handlePrintCopies(copyCount);
                          }}
                          style={{
                            backgroundColor: '#007bff',
                            color: '#fff',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Print Now
                        </button>
 
                        <button
                          onClick={() => setShowPrintPopup(false)}
                          style={{
                            backgroundColor: '#f44336',
                            color: '#fff',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
 
 
 
 
              </div>
 
              {autoGeneratePayslip && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                  <div ref={slipRef} id="printable">
                    <div style={{ height: "100vh" }}>
 
                      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
 
                        <div ref={slipRef} id="printable" style={{
                          width: '700px',
                          margin: 'auto',
                          padding: '20px',
                          border: '1px solid black',
                          backgroundColor: '#fff',
                          color: '#000'
                        }}>
                          {/* Header */}
                          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "75%" }} >
                              <img src="/" alt="schoolImage" />
                              <h2 style={{ margin: 0 }}>{schoolCode.toUpperCase()}</h2>
 
                            </div>
 
                            <hr style={{ height: '3px', backgroundColor: 'black', border: 'none' }} />
                            <h4 style={{ margin: 0 }}>Salary Recipt</h4>
                            <p style={{ marginTop: "7px" }}>Month:{salaryMonth} 2025 </p>
                          </div>
 
 
 
 
                          {/* Teacher Info */}
                          <table style={{ width: '100%', marginBottom: '20px' }}>
                            <tbody>
                              <tr>
                                <td><strong>Receipt No:</strong>451</td>
                                {/* <td><strong>Employee ID:</strong> T-{employeeId}</td> */}
                                <td><strong>Date: </strong>{getTodayFormatted()}</td>
                              </tr>
                              {/* <tr>
              <td><strong>Teacher Name:</strong>{formData.name}</td>
              <td><strong>Employee ID:</strong> T-{employeeId}</td>
            </tr> */}
                              <tr>
                                <td><strong>Teacher Name:</strong>{employeeInfo.name}</td>
                                <td><strong>School:</strong> {employeeInfo.school_name}</td>
                              </tr>
                              <tr>
                                {/* <td><strong>Joining Date:</strong> 10-06-2021</td> */}
                                {/* <td><strong>Bank A/C No:</strong> XXXX-XXXX-1234</td> */}
                              </tr>
                              <tr>
 
 
                                {/* <td><strong>PAN No:</strong> ABCDE1234F</td> */}
                                {/* <td><strong>UAN No:</strong> 100200300400</td> */}
                                <td><strong>Status:</strong> {monthlySalaryData.status}</td>
                                <td><strong>Salary Type:</strong> {monthlySalaryData.salary_type
                                }</td>
                                {/* <td><strong>Deductions:</strong> {deductions}</td> */}
                              </tr>
                            </tbody>
                          </table>
 
                          {/* Salary Details */}
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
  <thead>
    <tr>
      <th style={{ border: '1px solid black', padding: '8px', textAlign: "center" }}>Earnings</th>
      <th style={{ border: '1px solid black', padding: '8px', textAlign: "center" }}>Amount (INR)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none" }}>Basic Pay</td>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none" }}>{monthlySalaryData.base_salary || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderTop: "none", borderBottom: "none" }}>HRA</td>
      <td style={{ border: '1px solid black', padding: '8px', borderTop: "none", borderBottom: "none" }}>{monthlySalaryData.hra || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none" }}>Mediclaim</td>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none" }}>{monthlySalaryData.mediclaim || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', fontWeight: "bold" }}>DEDUCTIONS</td>
      <td style={{ border: '1px solid black', padding: '8px', fontWeight: "bold" }}>{monthlySalaryData.deductions || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none" }}>PF</td>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none" }}>{monthlySalaryData.pf || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none" }}>Professional Tax</td>
      <td style={{ border: '1px solid black', padding: '8px', borderBottom: "none", borderTop: "none" }}>{monthlySalaryData.professional_tax || 0}</td>
    </tr>
    <tr>
      <td style={{ border: '1px solid black', padding: '8px' }}><strong>Total Gross</strong></td>
      <td style={{ border: '1px solid black', padding: '8px' }}><strong>₹ {monthlySalaryData.final_salary || 0}</strong></td>
    </tr>
  </tbody>
</table>
 
                          {/* Net Pay */}
                          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                            {/* <h3>Net Pay: ₹ {monthlySalaryData.final_salary}</h3> */}
                            <p><em>(In words: ₹ {netPayInWords.charAt(0).toUpperCase() + netPayInWords.slice(1)} only)</em></p>
 
                          </div>
 
                          {/* Signatures */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <hr style={{ width: '200px' }} />
                              <p>Teacher Signature</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <hr style={{ width: '200px' }} />
                              <p>Authorized Signature</p>
                            </div>
                          </div>
 
 
                          {/* Footer */}
                          <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '30px' }}>
                            <p>This is a computer generated payslip and does not require a signature.</p>
                          </div>
                        </div>
                      </div>
                    </div>
 
                  </div>
                </div>
              )}
 
 
 
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
 
const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  modal: {
    width: '100%',
    maxWidth: '1000px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
    height: "72vh"
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer'
  },
  body: {
    marginTop: '20px'
  }
};
 
 
export default TeacherSalaryTable1;
 