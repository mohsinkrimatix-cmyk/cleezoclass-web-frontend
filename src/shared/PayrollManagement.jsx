import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Printer } from 'lucide-react';
import axios from 'axios';

// Helper function to handle fallback and relative images for the logo
const normalizeInstituteLogo = (logoUrl) => {
  if (!logoUrl) return "/default-logo.png";
  return logoUrl.startsWith('http') ? logoUrl : `https://cleezoclass.com:4000/${logoUrl}`;
};

const TeacherSalaryTable1 = () => {
  // State declarations
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
  const [schoolName, setSchoolName] = useState("Loading...");
  const [currentDbName, setCurrentDbName] = useState(localStorage.getItem("schoolCode") || "");
  const [instituteAddress, setInstituteAddress] = useState("");
  const [instituteAuthorizedPerson, setInstituteAuthorizedPerson] = useState("");
    
  useEffect(() => {
    if (!currentDbName) {
      console.log("[Header] No currentDbName found in localStorage");
      return;
    }
  
    console.log("[Header] Fetching institute info for dbName:", currentDbName);
  
    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${currentDbName}`)
      .then(res => {
        console.log("[Header] Institute response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("[Header] Institute data received:", data);
  
        setSchoolName(String(data.institute_name || "Unknown School").trim());
        localStorage.setItem("schoolName", String(data.institute_name || "Unknown School").trim());
  
        const normalizedLogo = normalizeInstituteLogo(data.logo);
        setLogo(normalizedLogo || "/default-logo.png");
        localStorage.setItem("schoolLogo", normalizedLogo || "/default-logo.png");
  
        setInstituteAddress(data.address || "Address not available");
        localStorage.setItem("schoolAddress", String(data.address || "Address not available"));
  
        const authorizedPerson = String(data.institute_authorized_person || "").trim();
        setInstituteAuthorizedPerson(authorizedPerson);
      })
      .catch(err => {
        console.error("[Header] Error fetching institute info:", err);
  
        setSchoolName("Unknown School");
        setLogo("/default-logo.png");
        setInstituteAddress("Address not available");
        setInstituteAuthorizedPerson("");
        localStorage.setItem("schoolName", "Unknown School");
        localStorage.setItem("schoolLogo", "/default-logo.png");
        localStorage.setItem("schoolAddress", "Address not available");
      });
  }, [currentDbName]);

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
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableBill, setEditableBill] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [paymentMode, setPaymentMode] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [salaryData, setSalaryData] = useState([]);
  const [monthlySalaryData, setMonthlySalaryData] = useState({
    base_salary: 0,
    hra: 0,
    pf: 0,
    professional_tax: 0,
    mediclaim: 0,
    deductions: 0,
    final_salary: 0,
    status: 'pending',
    salary_type: '',
  });
  const [showPrintPopup, setShowPrintPopup] = useState(false);
  const [copyCount, setCopyCount] = useState(1);
  const [paidLeaves, setPaidLeaves] = useState(0);
  const [url, setUrl] = useState();
  const [unPaidLeaves, setUnpaidLeaves] = useState(0);
  const [autoGeneratePayslip, setAutoGeneratePayslip] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({ name: '', school_name: '', email: "" });
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [lateHoursPerMonth, setLateHoursPerMonth] = useState(0);
  const [totalExcuseHours, setTotalExcuseHours] = useState(0);
  const [deductionOption, setDeductionOption] = useState('none');
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

  // Fetch school logo
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) return;
      setDynamicSchoolCode(code);
      try {
        const response = await axios.post(
          'https://nova-a.tagsol.in:5000/api/schoollogodynamic',
          { secretecode: code },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (response.data.logoPath) {
          setDynamicLogoSrc(response.data.logoPath);
        }
      } catch (error) {
        console.error('Error fetching school logo:', error);
      }
    };
    fetchSchoolLogo();
  }, []);

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacherData = async () => {
      const schoolCode = localStorage.getItem('schoolCode');
      if (!schoolCode) return;
      try {
        const response = await fetch(`https://cleezoclass.com:4000/api/teach?schoolCode=${encodeURIComponent(schoolCode)}`);
        const data = await response.json();
        setTeacherData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      }
    };
    fetchTeacherData();
  }, []);

  // Fetch base salary
  const fetchBaseSalaryById = async (employeeId, schoolCode) => {
    const url = `https://cleezoclass.com:4000/api/salary/${employeeId}?schoolCode=${encodeURIComponent(schoolCode)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setBaseSalary(data.salary_amount);
      
      // Seed default structural data immediately from basic payload search
      setMonthlySalaryData({
        base_salary: parseFloat(data.salary_amount || 0),
        hra: parseFloat(data.hra || 0),
        pf: parseFloat(data.pf || 0),
        professional_tax: parseFloat(data.professional_tax || 0),
        mediclaim: parseFloat(data.mediclaim || 0),
        deductions: parseFloat(data.deduction || data.deductions || 0),
        final_salary: parseFloat(data.salary_amount || 0),
        status: data.status || 'pending',
        salary_type: data.salary_type || 'monthly',
      });
      return data;
    } catch (error) {
      console.error("Error fetching base salary:", error);
      setError("Failed to fetch base salary.");
      return null;
    }
  };

  // Fetch attendance
  const fetchAttendanceById = async (employeeId, schoolCode) => {
    const url = `https://cleezoclass.com:4000/api/payroll/${employeeId}?schoolCode=${encodeURIComponent(schoolCode)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('No attendance found');
      return data;
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError("Failed to fetch attendance.");
      return [];
    }
  };

  // Fetch employee details
  const fetchEmployeeDetails = async (employeeId, schoolCode) => {
    try {
      const response = await fetch(`http://localhost:3020/api/getEmployeeData`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode, employeeId })
      });
      if (!response.ok) throw new Error('Failed to fetch employee data');
      return await response.json();
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setError("Failed to fetch employee details.");
      return null;
    }
  };

  // Handle monthly payslip upload
  const handleMonthlyPayslipUpload = async () => {
    const currentMonth = new Date().getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonth];
    const schoolCode = localStorage.getItem("schoolCode");
    for (const teacher of teacherData) {
      const { teacher_id: employeeId, teacher_name: name, email } = teacher;
      try {
        const baseSalaryData = await fetchBaseSalaryById(employeeId, schoolCode);
        const attendanceData = await fetchAttendanceById(employeeId, schoolCode);
        const employeeDetails = await fetchEmployeeDetails(employeeId, schoolCode);
        const { name: empName, school_name, email: empEmail } = employeeDetails?.data || {};
        setEmployeeInfo({ name: empName || '', school_name: school_name || '', email: empEmail || "" });
        
        const netSalary = parseFloat(baseSalaryData.salary_amount) - (
          parseFloat(baseSalaryData.hra || 0) +
          parseFloat(baseSalaryData.pf || 0) +
          parseFloat(baseSalaryData.professional_tax || 0) +
          parseFloat(baseSalaryData.mediclaim || 0) +
          parseFloat(baseSalaryData.deduction || baseSalaryData.deductions || 0)
        );
        setMonthlySalaryData({
          base_salary: baseSalaryData.salary_amount,
          hra: baseSalaryData.hra || 0,
          pf: baseSalaryData.pf || 0,
          professional_tax: baseSalaryData.professional_tax || 0,
          mediclaim: baseSalaryData.mediclaim || 0,
          deductions: baseSalaryData.deduction || baseSalaryData.deductions || 0,
          final_salary: netSalary,
          status: baseSalaryData.status || 'pending',
          salary_type: baseSalaryData.salary_type || 'monthly',
        });
        setSalaryMonth(monthName);
        setAutoGeneratePayslip(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const blob = await generateCompressedPDFBlob(slipRef.current, name, monthName);
        const formData_new = new FormData();
        formData_new.append("pdf", blob, `${name}_${monthName}_payslip.pdf`);
        formData_new.append("name", name);
        formData_new.append("email", email);
        await handleMailPayslipSend(formData_new);
        setAutoGeneratePayslip(false);
      } catch (err) {
        console.error(`Error for ${name}:`, err.message);
      }
    }
  };

  // Generate compressed PDF blob
  async function generateCompressedPDFBlob(element, name, monthName) {
    const canvas = await html2canvas(element, { scale: 1, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 0.6);
    const pdf = new jsPDF("p", "mm", "a4", true);
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    return pdf.output("blob");
  }

  // Handle mail payslip send
  const handleMailPayslipSend = async (formData_new) => {
    try {
      const res = await fetch("https://nova-a.tagsol.in:5000/api/sendpaySlip", {
        method: "POST",
        body: formData_new,
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      console.log("Payslip sent successfully:", data);
    } catch (err) {
      console.log("Error sending payslip:", err.message);
    }
  };

  // Start monthly upload scheduler
  const startMonthlyUpload = (targetHour, targetMinute, callback, teacherData) => {
    let hasRunThisMonth = false;
    const interval = setInterval(() => {
      const now = new Date();
      const day = now.getDate();
      const hour = now.getHours();
      const minute = now.getMinutes();
      if (day === 1 && hour === targetHour && minute === targetMinute) {
        if (!hasRunThisMonth && teacherData?.length > 0) {
          callback();
          hasRunThisMonth = true;
        }
      }
      if (day !== 1) hasRunThisMonth = false;
    }, 30000);
    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (teacherData?.length > 0) {
      const stop = startMonthlyUpload(10, 30, handleMonthlyPayslipUpload, teacherData);
      return () => stop();
    }
  }, [teacherData]);

  // Handle monthly data parsing logic correctly
  const handleMonthlyData = async (value) => {
    setSalaryMonth(value);
    if (!allAttendanceData?.length) return;
    const currentYear = new Date().getFullYear();
    const selectedMonthIndex = new Date(`${value} 1, ${currentYear}`).getMonth();
    const filteredData = allAttendanceData.filter((attendance) => {
      const attendanceDate = new Date(attendance.date);
      return attendanceDate.getFullYear() === currentYear && attendanceDate.getMonth() === selectedMonthIndex;
    });
    setAttendanceData(filteredData);
    let presentCount = 0, halfDayCount = 0, totalLateMinutes = 0;
    const standardStartTime = new Date("1970-01-01T09:00:00");
    filteredData.forEach((attendance) => {
      if (attendance.status?.toLowerCase() === "present") {
        presentCount++;
        const timeIn = new Date(`1970-01-01T${attendance.entry_time}`);
        const timeOut = attendance.exit_time ? new Date(`1970-01-01T${attendance.exit_time}`) : null;
        if (!timeOut) return;
        const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);
        if (hoursWorked < 5) halfDayCount++;
        if (timeIn > standardStartTime) {
          const lateTimeDiff = timeIn.getTime() - standardStartTime.getTime();
          totalLateMinutes += lateTimeDiff / (1000 * 60);
        }
      }
    });
    setPresentDays(presentCount);
    setHalfDays(halfDayCount);
    setLateHoursPerMonth(totalLateMinutes / 60);
    const absentCount = filteredData.filter((attendance) => attendance.status?.toLowerCase() === "absent").length;
    setUnpaidLeaves(absentCount);
    const schoolCode = localStorage.getItem("schoolCode");
    try {
      const res = await fetch("http://localhost:3020/getMonthlyData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode, salaryMonth: value, employeeId }),
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      if (data.success && data.data?.latestSalary) {
        const latest = data.data.latestSalary;
        
        const parsedBase = parseFloat(data.data.baseSalary || latest.salary_amount || 0);
        const parsedHra = parseFloat(latest.hra || 0);
        const parsedPf = parseFloat(latest.pf || 0);
        const parsedTax = parseFloat(latest.professional_tax || 0);
        const parsedMediclaim = parseFloat(latest.mediclaim || 0);
        const parsedDeduction = parseFloat(latest.deduction || latest.deductions || 0);
        
        const netSalary = parsedBase - (parsedPf + parsedTax + parsedDeduction);
        
        setMonthlySalaryData({
          base_salary: parsedBase,
          hra: parsedHra,
          pf: parsedPf,
          professional_tax: parsedTax,
          mediclaim: parsedMediclaim,
          deductions: parsedDeduction,
          final_salary: netSalary,
          status: latest.status || 'pending',
          salary_type: latest.salary_type || 'monthly',
        });
      }
    } catch (err) {
      console.log("Error fetching salary data:", err.message);
    }
  };

  // Calculate salary for month
  const calculateSalaryForMonth = () => {
    if (!attendanceData?.length) return alert("Please Select an Employee.");
    if (!paidLeaves) return alert("Please Enter Paid Leaves.");
    const rawDate = attendanceData[0].date;
    const data = new Date(rawDate);
    if (isNaN(data.getTime())) return;
    const month = data.getMonth() + 1;
    const year = data.getFullYear();
    const totalWorkDays = new Date(year, month, 0).getDate();
    const dailySalary = parseFloat(baseSalary) / totalWorkDays;
    const halfDaySalary = dailySalary / 2;
    let totalLeaves = totalWorkDays - presentDays;
    let deductedLeaves = totalLeaves - paidLeaves;
    let additionalHalfDays = 0, additionalFullDays = 0;
    let remainingLateHours = Math.max(0, lateHoursPerMonth - totalExcuseHours);
    if (deductionOption === 'halfDay' && halfDayDeductionInput > 0) {
      additionalHalfDays = Math.ceil(remainingLateHours / halfDayDeductionInput);
    } else if (deductionOption === 'fullDay' && fullDayDeductionInput > 0) {
      additionalFullDays = Math.ceil(remainingLateHours / fullDayDeductionInput);
    }
    let finalHalfDayCount = halfDays + additionalHalfDays;
    deductedLeaves += additionalFullDays;
    let totalDeductionsAmount = (deductedLeaves * dailySalary) + (finalHalfDayCount * halfDaySalary);
    const totalSalaryAmount = baseSalary - totalDeductionsAmount;
    setTotalSalary(totalSalaryAmount);
    setDeductions(totalDeductionsAmount);
    setMonthlySalaryData(prev => ({
      ...prev,
      base_salary: baseSalary,
      final_salary: totalSalaryAmount,
    }));
  };

  // Save salary
  const saveSalary = () => {
    if (!totalSalary) {
      setError('Please calculate salary before saving.');
      return;
    }
    if (!monthlySalaryData.base_salary || !monthlySalaryData.final_salary) {
      setError('Base salary and final salary are required.');
      return;
    }
    const schoolCode = localStorage.getItem('schoolCode') || '';
    if (!schoolCode) {
      setError('School code is missing. Please select a school.');
      return;
    }
    let finalSalaryMonth = salaryMonth;
    if (!finalSalaryMonth) {
      finalSalaryMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      setSalaryMonth(finalSalaryMonth);
    }
    const totalDeduction = (
      parseFloat(monthlySalaryData.pf || 0) +
      parseFloat(monthlySalaryData.professional_tax || 0) +
      parseFloat(monthlySalaryData.deductions || 0)
    );
    setIsLoading(true);
    fetch('https://cleezoclass.com:4000/api/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode,
        teacher_id: employeeId,
        base_salary: monthlySalaryData.base_salary,
        deductions: totalDeduction,
        bonuses: monthlySalaryData.mediclaim,
        final_salary: monthlySalaryData.final_salary,
        salary_month: finalSalaryMonth,
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

  // Handle search
  const handleSearch = () => {
    const schoolCode = localStorage.getItem('schoolCode') || '';
    if (!employeeId) {
      setError('Please enter a valid Employee ID.');
      return;
    }
    fetchBaseSalaryById(employeeId, schoolCode);
    fetchAttendanceById(employeeId, schoolCode)
      .then(data => {
        setAllAttendanceData(data);
        setAttendanceData(data);
        let presentCount = 0, halfDayCount = 0, totalLateMinutes = 0;
        const standardStartTime = new Date('1970-01-01T09:00:00');
        data.forEach((attendance) => {
          if (attendance.status?.toLowerCase() === 'present') {
            presentCount++;
            const timeIn = new Date(`1970-01-01T${attendance.entry_time}`);
            const timeOut = attendance.exit_time ? new Date(`1970-01-01T${attendance.exit_time}`) : null;
            if (!timeOut) return;
            const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);
            if (hoursWorked < 5) halfDayCount++;
            if (timeIn > standardStartTime) {
              const lateTimeDiff = timeIn.getTime() - standardStartTime.getTime();
              totalLateMinutes += lateTimeDiff / (1000 * 60);
            }
          }
        });
        setPresentDays(presentCount);
        setHalfDays(halfDayCount);
        setLateHoursPerMonth(totalLateMinutes / 60);
      })
      .catch(error => {
        setError('Error fetching attendance data. Please try again.');
      });
  };

  // Convert amount to words
  const convertAmountToWords = (num) => {
    if (isNaN(num)) return 'Invalid amount';
    if (num === 0) return 'Zero Rupees Only';
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
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
    if (parts.length > 0) str += parts.join(' ') + ' Rupees';
    if (paise > 0) str += (str ? ' and ' : '') + getWords(paise) + ' Paise';
    return str.trim() + ' Only';
  };

  // Handle name change
  const handleNameChange = (e) => {
    const selectedName = e.target.value;
    const selectedTeacher = teacherData.find((teacher) => teacher.teacher_name === selectedName);
    if (selectedTeacher) {
      setFormData({ name: selectedName, teacher_id: selectedTeacher.teacher_id });
      setEmployeeId(selectedTeacher.teacher_id);
    }
  };

  // Handle ID change
  const handleIdChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedTeacher = teacherData.find((teacher) => teacher.teacher_id === selectedId);
    if (selectedTeacher) {
      setFormData({ teacher_id: selectedId, name: selectedTeacher.teacher_name });
      setEmployeeId(selectedId);
      setSalaryMonth("");
    }
  };

  // Handle download
  const handleDownloadNew = async () => {
    if (!slipRef.current) return;
    const originalBoxShadow = slipRef.current.style.boxShadow;
    slipRef.current.style.boxShadow = 'none';
    const canvas = await html2canvas(slipRef.current, {
      scale: window.devicePixelRatio * 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 148.5] });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    const imgHeight = pdfWidth / imgRatio;
    const yOffset = (pdfHeight - imgHeight) / 2;
    pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, imgHeight);
    slipRef.current.style.boxShadow = originalBoxShadow;
    pdf.save('Teacher_Payslip.pdf');
  };

  // Get today's date formatted
  const getTodayFormatted = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Handle print copies
  const handlePrintCopies = (copies) => {
    const copiesPerPage = 2;
    const totalPages = Math.ceil(copies / copiesPerPage);
    const printWindow = window.open('', 'PRINT', 'height=820,width=595');
    let htmlContent = `<html><head><title>Print Payslips</title><style>
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
      #printable { width: 100%; max-width: 794px; margin: auto; overflow: hidden; zoom: 0.85; }
      button { display: none !important; }
      .page { page-break-after: always; width: 250mm; height: 420mm; box-sizing: border-box; padding: 5mm; display: flex; flex-wrap: wrap; justify-content: space-between; align-content: space-between; }
      .copy { width: 49%; height: 49%; box-sizing: border-box; border: 1px solid black; font-family: Arial, sans-serif; font-size: 12px; padding: 10px; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-start; transform: scale(1.05); transform-origin: top left; }
    </style></head><body>`;
    for (let page = 0; page < totalPages; page++) {
      htmlContent += `<div class="page">`;
      for (let i = 0; i < copiesPerPage; i++) {
        const copyIndex = page * copiesPerPage + i;
        if (copyIndex >= copies) break;
        htmlContent += `<div class="copy">${slipRef.current.innerHTML}</div>`;
      }
      htmlContent += `</div>`;
    }
    htmlContent += `<script>window.onload = () => { window.print(); window.close(); }</script></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <>
      <div className="outer-container">
        <div className="main-content">
          <div ref={dashboardRef}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px', marginTop: "20px", backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}>
              <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Attendance Details</h1>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="teacher_name" style={{ fontWeight: 'bold' }}>Employee Name:</label>
                  <select id="teacher_name" value={formData.name} onChange={handleNameChange} required style={{ padding: '8px', borderRadius: '5px', width: '100%' }}>
                    <option value="">Select Employee Name</option>
                    {teacherData.map((teacher) => <option key={teacher.teacher_id} value={teacher.teacher_name}>{teacher.teacher_name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="teacher_id" style={{ fontWeight: 'bold' }}>Employee ID:</label>
                  <select id="teacher_id" value={formData.teacher_id} onChange={handleIdChange} required style={{ padding: '8px', borderRadius: '5px', width: '100%' }}>
                    <option value="">Select Employee ID</option>
                    {teacherData.map((teacher) => <option key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.teacher_id}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={handleSearch} style={{ padding: isMobile ? '9px 11px' : '10px 20px', fontSize: isMobile ? '14px' : '16px', backgroundColor: 'rgba(141,171,182,255)', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 }}>Search</button>
                </div>
              </div>
              <div id="responsiveContainer" style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  {attendanceData.length >= 0 && (
                    <div>
                      <h4>Attendance Summary</h4>
                      <div style={{ backgroundColor: 'rgba(141,171,182,255)', padding: '15px', borderRadius: '5px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: '0 20px 0 0', color:'#fff' }}>Total Present Days: {presentDays}</h4>
                        <h4 style={{ margin: 0 , color:'#fff'}}>Total Half Days: {halfDays}</h4>
                      </div>
                      <div id="responsiveTableWrapper" style={{ overflowX: 'auto' }}>
                        <table id="responsiveTable" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', minWidth: '600px' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'rgba(141,171,182,255)', color: 'white' }}>
                              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Attendance ID</th>
                              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Name</th>
                              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Date</th>
                              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Status</th>
                              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Time In</th>
                              <th style={{ padding: '10px', border: '1px solid #ccc' }}>Time Out</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceData.map((attendance, index) => (
                              <tr key={attendance.id || index} style={{ textAlign: 'center', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f2f2f2' }}>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{attendance.id || index + 1}</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{attendance.username || formData.name}</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{new Date(attendance.date).toLocaleDateString()}</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{attendance.status}</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{attendance.entry_time || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{attendance.exit_time || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  {baseSalary !== '' && (
                    <div>
                      <h4>Salary Details</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f0ff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                        <div><h4 style={{ margin: 0 }}>Base Salary: ₹{baseSalary}</h4></div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <label htmlFor="salaryMonth" style={{ marginRight: '5px' }}>Select Month:</label>
                          <select id="salaryMonth" value={salaryMonth} onChange={(e) => handleMonthlyData(e.target.value)} style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}>
                            <option value="">Select Month</option>
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => <option key={month} value={month}>{month}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Late Hour Deductions</h4>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>Total Late Hours per Month: <strong>{lateHoursPerMonth.toFixed(2)} hours</strong></p>
                        <label htmlFor="totalExcuseHours" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>A: Total Excuse Hours per Month:</label>
                        <input type="number" id="totalExcuseHours" value={totalExcuseHours} onChange={(e) => setTotalExcuseHours(parseFloat(e.target.value) || 0)} style={{ padding: '8px', borderRadius: '5px', width: '100%', marginBottom: '10px', border: '1px solid #ccc' }} min="0" />
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Select Deduction Option:</label>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div>
                              <input type="radio" id="halfDayDeduction" name="deductionOption" value="halfDay" checked={deductionOption === 'halfDay'} onChange={(e) => setDeductionOption(e.target.value)} style={{ marginRight: '5px' }} />
                              <label htmlFor="halfDayDeduction">B: Half Day deduction after excuse hours (A)</label>
                            </div>
                            <div>
                              <input type="radio" id="fullDayDeduction" name="deductionOption" value="fullDay" checked={deductionOption === 'fullDay'} onChange={(e) => setDeductionOption(e.target.value)} style={{ marginRight: '5px' }} />
                              <label htmlFor="fullDayDeduction">C: Full Day deduction after excuse hours (A)</label>
                            </div>
                          </div>
                        </div>
                        {deductionOption === 'halfDay' && (
                          <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="halfDayDeductionInput" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>B: Half Day Deduction Input (hours):</label>
                            <input type="number" id="halfDayDeductionInput" value={halfDayDeductionInput} onChange={(e) => setHalfDayDeductionInput(parseFloat(e.target.value) || 0)} style={{ padding: '8px', borderRadius: '5px', width: '100%', border: '1px solid #ccc' }} min="0" />
                          </div>
                        )}
                        {deductionOption === 'fullDay' && (
                          <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="fullDayDeductionInput" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>C: Full Day Deduction Input (hours):</label>
                            <input type="number" id="fullDayDeductionInput" value={fullDayDeductionInput} onChange={(e) => setFullDayDeductionInput(parseFloat(e.target.value) || 0)} style={{ padding: '8px', borderRadius: '5px', width: '100%', border: '1px solid #ccc' }} min="0" />
                          </div>
                        )}
                      </div>
                      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <div style={{ padding: '10px 25px', borderRadius: '2px', border: 'none', color: 'white', width: '190px' }}>
                          <span style={{ width: "100%", padding: "6px", marginBottom: "15px", fontSize: "16px", textAlign: "center", border: "2px solid #6c63ff", borderRadius: "10px", outline: "none", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", transition: "all 0.3s ease-in-out", backgroundColor: "#f8f9fa", color: "#333" }}>Total Leaves :<strong>{unPaidLeaves || 0}</strong></span>
                          <input style={{ marginTop: "10px", width: "100%", padding: "2px", marginBottom: "15px", fontSize: "16px", textAlign: "center", border: "2px solid #6c63ff", borderRadius: "10px", outline: "none", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", transition: "all 0.3s ease-in-out", backgroundColor: "#f8f9fa", color: "#333" }} placeholder="Paid Leaves" value={paidLeaves} onChange={(e) => setPaidLeaves(e.target.value)} />
                        </div>
                        <button onClick={calculateSalaryForMonth} disabled={!salaryMonth} title={!salaryMonth ? "Please select a month first" : ""} style={{ padding: '10px 25px', borderRadius: '5px', border: 'none', backgroundColor: !salaryMonth ? '#cccccc' : 'rgba(141,171,182,255)', color: 'white', cursor: !salaryMonth ? 'not-allowed' : 'pointer', width: 'fit-content', height: "40px" }}>Calculate Salary</button>
                        <button onClick={saveSalary} style={{ padding: '10px 25px', borderRadius: '5px', border: 'none', backgroundColor: 'rgba(141,171,182,255)', color: 'white', cursor: 'pointer', width: 'fit-content', height: "40px" }}>Save Salary</button>
                      </div>
                      {salaryMonth && <button onClick={() => setShowModal(true)} style={{ padding: '10px 25px', borderRadius: '5px', border: 'none', backgroundColor: 'rgba(141,171,182,255)', marginLeft: "30px", color: 'white', cursor: 'pointer', width: 'fit-content', height: "40px", marginBottom: "40px" }}>Pay Slip</button>}
                      <div>
                        {error && <p style={{ color: 'red', fontWeight: 'bold', marginBottom: '15px' }}>{error}</p>}
                        {totalSalary !== null && (
                          <div style={{ backgroundColor: '#e8f0ff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                            <h3>Total Salary: ₹{totalSalary.toFixed(2)}</h3>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', padding: '1.5rem', width: '90%', maxWidth: '900px', height: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem 1rem', color: 'white', backgroundColor: 'rgba(141,171,182,255)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.3s ease-in-out' }}>Close</button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button style={{ backgroundColor: 'rgba(141,171,182,255)', padding: '0.5rem 1rem', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.3s ease-in-out' }} onClick={handleDownloadNew}>📤 Send</button>
                <button onClick={() => setShowPrintPopup(true)} style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(141,171,182,255)', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}><Printer size={16} style={{ marginRight: '0.5rem' }} />Print</button>
                <button onClick={handleDownloadNew} style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(141,171,182,255)', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}><Download size={16} style={{ marginRight: '0.5rem' }} />Download</button>
              </div>
            </div>
            <div style={{ height: "100vh" }}>
              <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                <div ref={slipRef} id="printable" style={{ width: '700px', margin: 'auto', padding: '20px', border: '1px solid black', backgroundColor: '#fff', color: '#000' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{schoolName}</div>
                    <hr style={{ height: '3px', backgroundColor: 'black', border: 'none' }} />
                    <h4 style={{ margin: 0 }}>Salary Receipt</h4>
                    <p style={{ marginTop: "7px" }}>Month: {salaryMonth} 2026</p>
                  </div>
                  <table style={{ width: '100%', marginBottom: '20px' }}>
                    <tbody>
                      <tr><td><strong>Receipt No:</strong> 451</td><td><strong>Date: </strong>{getTodayFormatted()}</td></tr>
                      <tr><td><strong>Teacher Name:</strong> {formData.name}</td><td><strong>Salary Type:</strong> {monthlySalaryData.salary_type}</td></tr>
                    </tbody>
                  </table>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontFamily: 'Arial, sans-serif', fontSize: '14px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', backgroundColor: '#f2f2f2' }}>Earnings</th>
                        <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', backgroundColor: '#f2f2f2' }}>Amount (INR)</th>
                        <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', backgroundColor: '#f2f2f2' }}>Deductions</th>
                        <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', backgroundColor: '#f2f2f2' }}>Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ border: '1px solid black', padding: '8px' }}>Basic Pay</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>{monthlySalaryData.base_salary || 0}</td><td style={{ border: '1px solid black', padding: '8px' }}>GPF / NPS (Pension Contribution)</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>{monthlySalaryData.pf || 0}</td></tr>
                      <tr><td style={{ border: '1px solid black', padding: '8px' }}>HRA</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>{monthlySalaryData.hra || 0}</td><td style={{ border: '1px solid black', padding: '8px' }}>Professional Tax</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>{monthlySalaryData.professional_tax || 0}</td></tr>
                      <tr><td style={{ border: '1px solid black', padding: '8px' }}>Bonus</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>{monthlySalaryData.mediclaim || 0}</td><td style={{ border: '1px solid black', padding: '8px' }}>Income Tax (TDS)</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>0</td></tr>
                      <tr><td style={{ border: '1px solid black', padding: '8px' }}>Other Allowances</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>0.00</td><td style={{ border: '1px solid black', padding: '8px' }}>Other Deductions (Loan, etc.)</td><td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>{monthlySalaryData.deductions || 0}</td></tr>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>Total Addition</td>
                        <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹ {(parseFloat(monthlySalaryData.base_salary || 0) + parseFloat(monthlySalaryData.hra || 0) + parseFloat(monthlySalaryData.mediclaim || 0)).toFixed(2)}</td>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>Total Deduction</td>
                        <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹ {(parseFloat(monthlySalaryData.pf || 0) + parseFloat(monthlySalaryData.professional_tax || 0) + parseFloat(monthlySalaryData.deductions || 0)).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" style={{ border: '1px solid black', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f2f2f2' }}>Net Salary</td>
                        <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f2f2f2' }}>₹ {(parseFloat(monthlySalaryData.base_salary || 0) + parseFloat(monthlySalaryData.hra || 0) + parseFloat(monthlySalaryData.mediclaim || 0) - (parseFloat(monthlySalaryData.pf || 0) + parseFloat(monthlySalaryData.professional_tax || 0) + parseFloat(monthlySalaryData.deductions || 0))).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ fontStyle: 'italic', textAlign: 'left' }}>(In words: ₹ {convertAmountToWords(parseFloat(monthlySalaryData.base_salary || 0) + parseFloat(monthlySalaryData.hra || 0) + parseFloat(monthlySalaryData.mediclaim || 0) - (parseFloat(monthlySalaryData.pf || 0) + parseFloat(monthlySalaryData.professional_tax || 0) + parseFloat(monthlySalaryData.deductions || 0)))})</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                    <div style={{ textAlign: 'center' }}><hr style={{ width: '200px' }} /><p>Teacher Signature</p></div>
                    <div style={{ textAlign: 'center' }}><hr style={{ width: '200px' }} /><p>Authorized Signature</p></div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '30px' }}><p>This is a computer generated payslip and does not require a signature.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPrintPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px 25px', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', width: '350px', textAlign: 'center', fontFamily: 'Segoe UI, sans-serif' }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Select Number of Copies <br /><span style={{ fontSize: '14px' }}>(max 4 per page)</span></h3>
            <input type="number" min="1" max="44" value={copyCount} onChange={(e) => setCopyCount(Math.min(44, Math.max(1, Number(e.target.value))))} style={{ padding: '10px', width: '80%', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => { setShowPrintPopup(false); handlePrintCopies(copyCount); }} style={{ backgroundColor: '#007bff', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Print Now</button>
              <button onClick={() => setShowPrintPopup(false)} style={{ backgroundColor: '#f44336', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherSalaryTable1;