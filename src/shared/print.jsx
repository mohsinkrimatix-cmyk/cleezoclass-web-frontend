








import { Filter, FileText, Download, Printer, Edit, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
// import DiscountedStudents from './Discounts';

const GenerateBillPrint = () => {
  const [studentData, setStudentData] = useState(null);
  const [previewMode, setPreviewMode] = useState(1);
  const [totalPaid, setTotalPaid] = useState(0);
  const [feeStructure, setFeeStructure] = useState({
    academicFee: 0,
    uniformFee: 0,
    bookFee: 0,
    transportFee: 0,
    labFee: 0,
    miscellaneousFee: 0,
    hostelFee: 0,
    messFee: 0,
    completeFee: 0
  });
  const [paymentHistory, setPaymentHistory] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedClass, setSelectedClass] = useState("nursery");
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [initialReceiptSet, setInitialReceiptSet] = useState(false);
  const [paymentMode, setPaymentMode] = useState('');
  const [payments, setPayments] = useState(null);
  const [generatedBills, setGeneratedBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableBill, setEditableBill] = useState(null);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const [examFee, setExamFee] = useState(0);
  const [busFee, setBusFee] = useState(0);
  const [bookFee, setBookFee] = useState(0);
  const [uniformFee, setUniformFee] = useState(0);
  const [othersFee, setOthersFee] = useState(0);
  const [tuitionFee, setTuitionFee] = useState(0);
  const [tuitionPaid, setTuitionPaid] = useState(0);
  const [examPaid, setExamPaid] = useState(0);
  const [busPaid, setBusPaid] = useState(0);
  const [bookPaid, setBookPaid] = useState(0);
  const [uniformPaid, setUniformPaid] = useState(0);
  const [othersPaid, setOthersPaid] = useState(0);
  const [admissionFee, setAdmissionFee] = useState(0);
  const [admissionPaid, setAdmissionPaid] = useState(0);
  
  // --- NEW STATE FOR SUCCESS POP-UP ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // --- CHANGE START ---
  // 1. ADD NEW STATE TO HOLD THE FOUND IMAGE URL
  // This state will store the link to the image from your "uploads" folder.
  const [searchedBillImageUrl, setSearchedBillImageUrl] = useState('');
  // --- CHANGE END ---


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

  useEffect(() => {
    const storedBills = localStorage.getItem('generatedBills');
    if (storedBills) {
      setGeneratedBills(JSON.parse(storedBills));
    }
    const storedSchoolName = localStorage.getItem('schoolCode');
    if (storedSchoolName) {
      let formattedName = storedSchoolName.replace(/_/g, ' ').trim();
      if (!/school$/i.test(formattedName)) {
        formattedName += ' School';
      }
      setSchoolName(formattedName);
    }
    const lastReceipt = localStorage.getItem('lastReceiptNumber');
    if (lastReceipt) {
      setReceiptNumber(parseInt(lastReceipt));
      setInitialReceiptSet(true);
    }
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode');
    axios.get(`https://cleezoclass.com:4000/api/studentsName/${selectedClass}?schoolCode=${schoolCode}`)
      .then(res => {
        setStudents(res.data.students);
        if (res.data.students.length > 0) {
          setSelectedStudentId(res.data.students[0].id);
        }
      })
      .catch(err => console.error("Error fetching students:", err));
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedStudentId) return;
    const selected = students.find(s => s.id === selectedStudentId);
    if (!selected) return;
    setStudentData({
      name: selected.name,
      fatherName: selected.fatherName || 'Not Available',
      class: selectedClass,
      section: selected.section || 'A',
      rollNumber: selected.id.toString(),
      billType: 'full-package'
    });
    incrementReceiptNumber();
    const schoolCode = localStorage.getItem('schoolCode');
    axios.get(`https://cleezoclass.com:4000/api/feeStructure/${selectedStudentId}?schoolCode=${schoolCode}`)
      .then(feeRes => {
        if (feeRes.data?.feeStructure) {
          setFeeStructure(feeRes.data.feeStructure);
        }
      })
      .catch(err => console.error("Error fetching fee structure:", err));
    axios.get(`https://cleezoclass.com:4000/api/paymentHistory/${selectedStudentId}?schoolCode=${schoolCode}`)
      .then(paymentRes => {
        const paymentData = paymentRes.data.payments || {};
        setPayments(paymentData);
        const completeFee = parseFloat(paymentData.completeFee) || 0;
        const examFee = parseFloat(paymentData.examFee) || 0;
        const busFee = parseFloat(paymentData.busFee) || 0;
        const bookFee = parseFloat(paymentData.bookFee) || 0;
        const uniformFee = parseFloat(paymentData.uniformFee) || 0;
        const othersFee = parseFloat(paymentData.othersFee) || 0;
        const admissionFee = parseFloat(paymentData.admissionFee) || 0;
        const examPaid = parseFloat(paymentData.examPaid) || 0;
        const busPaid = parseFloat(paymentData.busPaid) || 0;
        const bookPaid = parseFloat(paymentData.bookPaid) || 0;
        const uniformPaid = parseFloat(paymentData.uniformPaid) || 0;
        const othersPaid = parseFloat(paymentData.othersPaid) || 0;
        const generalPaid = parseFloat(paymentData.paidAmount) || 0;
        const tuitionPaid = generalPaid;
        const admissionPaid = parseFloat(paymentData.admissionPaid) || 0;
        const totalIndividualPaid = examPaid + busPaid + bookPaid + uniformPaid + othersPaid;
        const totalPaid = totalIndividualPaid + generalPaid;
        const remainingAmount = completeFee - totalPaid;
        const tuitionFee = completeFee - examFee - busFee - bookFee - uniformFee - othersFee;
        setTotalAmount(completeFee);
        setPaidAmount(totalPaid);
        setRemainingAmount(remainingAmount);
        setTuitionFee(tuitionFee);
        setExamFee(examFee);
        setBusFee(busFee);
        setBookFee(bookFee);
        setUniformFee(uniformFee);
        setOthersFee(othersFee);
        setExamPaid(examPaid);
        setBusPaid(busPaid);
        setBookPaid(bookPaid);
        setUniformPaid(uniformPaid);
        setOthersPaid(othersPaid);
        setTuitionPaid(tuitionPaid);
        setAdmissionFee(admissionFee);
        setAdmissionPaid(admissionPaid);
        setEditableBill({
          tuitionPaid: tuitionPaid,
          examPaid: examPaid,
          busPaid: busPaid,
          bookPaid: bookPaid,
          uniformPaid: uniformPaid,
          othersPaid: othersPaid,
          paymentMode: paymentData.paymentMode || ''
        });
      })
      .catch(err => console.error("Error fetching payment history:", err));
  }, [selectedStudentId, students, selectedClass]);

  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditableBill({
        tuitionPaid: tuitionPaid,
        examPaid: examPaid,
        busPaid: busPaid,
        bookPaid: bookPaid,
        uniformPaid: uniformPaid,
        othersPaid: othersPaid,
        paymentMode: paymentMode
      });
    } else {
      setIsEditing(true);
      setEditableBill({
        tuitionPaid: tuitionPaid,
        examPaid: examPaid,
        busPaid: busPaid,
        bookPaid: bookPaid,
        uniformPaid: uniformPaid,
        othersPaid: othersPaid,
        paymentMode: paymentMode
      });
    }
  };

  const handleEditChange = (field, value) => {
    setEditableBill(prev => ({
      ...prev,
      [field]: value
    }));
  };

const saveEditedBill = async (e) => {
    e.preventDefault();

    // Part 1: Update State (This remains the same)
    const newTuitionPaid = parseFloat(editableBill?.tuitionPaid) || 0;
    const newExamPaid = parseFloat(editableBill?.examPaid) || 0;
    const newBusPaid = parseFloat(editableBill?.busPaid) || 0;
    const newBookPaid = parseFloat(editableBill?.bookPaid) || 0;
    const newUniformPaid = parseFloat(editableBill?.uniformPaid) || 0;
    const newOthersPaid = parseFloat(editableBill?.othersPaid) || 0;
    const newPaymentMode = editableBill?.paymentMode || '';
    const newTotalPaid = newTuitionPaid + newExamPaid + newBusPaid + newBookPaid + newUniformPaid + newOthersPaid;
    const totalFeeAmount = (tuitionFee || 0) + (admissionFee || 0) + (examFee || 0) + (busFee || 0) + (bookFee || 0) + (uniformFee || 0) + (othersFee || 0);

    setTuitionPaid(newTuitionPaid);
    setExamPaid(newExamPaid);
    setBusPaid(newBusPaid);
    setBookPaid(newBookPaid);
    setUniformPaid(newUniformPaid);
    setOthersPaid(newOthersPaid);
    setPaidAmount(newTotalPaid);
    setRemainingAmount(Math.max(totalFeeAmount - newTotalPaid, 0));
    setPaymentMode(newPaymentMode);
    setIsEditing(false);

    // Part 2: Wait for React to Re-render the UI
    setTimeout(async () => {
        const sourceElement = document.getElementById('bill-preview-content')?.children[0];
        if (!sourceElement) {
            alert("Could not find the bill content to generate the image.");
            setIsEditing(true);
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.border = 'none';

        try {
            document.body.appendChild(iframe);
            const iframeDoc = iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body></body></html>');
            iframeDoc.close();
            
            const clonedElement = sourceElement.cloneNode(true);
            clonedElement.style.width = '280px';
            clonedElement.style.boxSizing = 'border-box';
            iframeDoc.body.appendChild(clonedElement);
            iframeDoc.body.style.margin = '0';

            // --- THIS IS THE FINAL CSS WITH THE FONT SIZE CHANGE ---
            const style = iframeDoc.createElement('style');
            style.innerHTML = `
                * {
                    font-family: Arial, sans-serif !important;
                    color: #000 !important;
                    font-weight: 400 !important;
                    -webkit-font-smoothing: none !important;
                    font-smooth: never !important;
                    text-rendering: geometricPrecision !important;
                }
                
                /* --- KEY CHANGE: Reduce font size ONLY for the top info table --- */
                table:first-of-type td {
                    font-size: 9px !important;
                    padding: 1px 2px !important; /* Add a little padding for smaller text */
                }

                td, th { border-color: #000 !important; }

                h1 { color: #1e40af !important; }
                
                th, tr[style*="background-color: #f8f8f8"] * {
                   background-color: #f0f0f0 !important;
                }
            `;
            iframeDoc.head.appendChild(style);
            
            await new Promise(resolve => setTimeout(resolve, 150));

            const canvas = await html2canvas(clonedElement, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                letterRendering: true,
                removeContainer: true
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
            if (!blob) throw new Error("Failed to create blob.");
            
            const schoolCode = localStorage.getItem('schoolCode');
            if (!schoolCode || !studentData) throw new Error("Missing data.");

                console.log("DATA BEING SENT TO BACKEND:", {
                  receiptNumber: receiptNumber,
                  studentName: studentData.name,
                  class: studentData.class,
                  section: studentData.section,
                  schoolCode: schoolCode,
                  regn_no: studentData.rollNumber // Check this value specifically!
              });

            // In saveEditedBill...   
            console.log("THE FULL STUDENT DATA OBJECT IS:", studentData);

            const formData = new FormData();
            formData.append('billImage', blob, `receipt-${receiptNumber}-${studentData.name}.png`);
            formData.append('receiptNumber', receiptNumber);
            formData.append('studentName', studentData.name);
            formData.append('class', studentData.class);
            formData.append('section', studentData.section);
            formData.append('schoolCode', schoolCode);
            formData.append('regn_no', studentData.rollNumber);
            const response = await axios.post('https://cleezoclass.com:4000/api/bill/save', formData);
            if (response.status === 200) {
                setSuccessMessage("Saved successfully!");
                setShowSuccessModal(true);
            }

        } catch (error) {
            console.error('Error saving bill image:', error);
            alert(`Failed to save image: ${error.message}`);
            setIsEditing(true);
        } finally {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }
    }, 100);
};

  // --- CHANGE START ---
  // 2. MODIFY THE SEARCH FUNCTION
  // This function is now `async` to handle the API call. It calls an endpoint on your server
  // to fetch the bill data and the image URL.
const searchBillsByReceiptNumber = async () => {
    if (!searchTerm) {
        alert('Please enter a receipt number');
        return;
    }

    setIsSearching(true);
    setSearchedBillImageUrl('');
    setStudentData(null);
    setSearchResults(null);

    try {
        const schoolCode = localStorage.getItem('schoolCode');
        if (!schoolCode) {
            alert('School authentication missing. Please log in again.');
            setIsSearching(false);
            return;
        }

        const response = await axios.get(
            `https://cleezoclass.com:4000/api/bill/find/${searchTerm}`,
            { params: { schoolCode } }
        );

        // Debugging: Log the raw image path from response
        console.log("Raw image path from API:", response.data.imageUrl);

        if (response.data?.bill) {
            const foundBill = response.data.bill;
            
            // FIX 1: Properly construct image URL
            const cleanImagePath = response.data.imageUrl.replace(/^\/?/, ''); // Remove leading slash if exists
            const imageUrl = `https://cleezoclass.com:4000/${cleanImagePath}`;
            
            // Debugging: Verify the constructed URL
            console.log("Constructed image URL:", imageUrl);
            setSearchedBillImageUrl(imageUrl);

            // FIX 2: Handle student data safely
            let studentData = { 
                class: '', 
                rollNumber: '', 
                name: '', 
                fatherName: '', 
                section: '' 
            };
            
            try {
                if (foundBill.studentData) {
                    studentData = typeof foundBill.studentData === 'string' 
                        ? JSON.parse(foundBill.studentData) 
                        : foundBill.studentData;
                }
            } catch (parseError) {
                console.error("Error parsing studentData:", parseError);
            }

            // Set search results and form fields
            setSearchResults(foundBill);
            setSelectedClass(studentData.class || '');
            setSelectedStudentId(parseInt(studentData.rollNumber) || 0);
            setReceiptNumber(foundBill.receiptNumber || '');
            setPaymentMode(foundBill.paymentMode || '');
            
            // Set fee amounts with null checks
            const defaultFee = 0;
            const fees = {
                tuition: foundBill.tuitionFee ?? defaultFee,
                exam: foundBill.examFee ?? defaultFee,
                bus: foundBill.busFee ?? defaultFee,
                book: foundBill.bookFee ?? defaultFee,
                uniform: foundBill.uniformFee ?? defaultFee,
                others: foundBill.othersFee ?? defaultFee
            };
            
            const paid = {
                tuition: foundBill.tuitionPaid ?? defaultFee,
                exam: foundBill.examPaid ?? defaultFee,
                bus: foundBill.busPaid ?? defaultFee,
                book: foundBill.bookPaid ?? defaultFee,
                uniform: foundBill.uniformPaid ?? defaultFee,
                others: foundBill.othersPaid ?? defaultFee
            };

            // Update state
            setTuitionFee(fees.tuition);
            setTuitionPaid(paid.tuition);
            setExamFee(fees.exam);
            setExamPaid(paid.exam);
            setBusFee(fees.bus);
            setBusPaid(paid.bus);
            setBookFee(fees.book);
            setBookPaid(paid.book);
            setUniformFee(fees.uniform);
            setUniformPaid(paid.uniform);
            setOthersFee(fees.others);
            setOthersPaid(paid.others);
            
            // Calculate totals
            const total = Object.values(fees).reduce((sum, fee) => sum + fee, 0);
            const totalPaid = Object.values(paid).reduce((sum, p) => sum + p, 0);
            
            setTotalAmount(total);
            setPaidAmount(totalPaid);
            setRemainingAmount(total - totalPaid);

            // Set editable bill fields
            setEditableBill({
                ...paid,
                paymentMode: foundBill.paymentMode || ''
            });

            // Set student data
            setStudentData({
                name: studentData.name || '',
                fatherName: studentData.fatherName || '',
                class: studentData.class || '',
                rollNumber: studentData.rollNumber || '',
                section: studentData.section || ''
            });
        } else {
            alert('No bill found with that receipt number');
            resetFormFields();
        }
    } catch (error) {
        console.error('Error searching bills:', error);
        
        // FIX 3: Better error handling for 404
        if (error.response?.status === 404) {
            alert('The requested resource was not found. Please check the receipt number.');
        } else {
            alert(error.response?.data?.message || 
                  error.message || 
                  'Failed to search for the bill');
        }
        
        resetFormFields();
    } finally {
        setIsSearching(false);
    }
};

// Helper function to reset form fields
const resetFormFields = () => {
    setStudentData(null);
    setFeeStructure({
        academicFee: 0, 
        uniformFee: 0, 
        bookFee: 0, 
        transportFee: 0, 
        labFee: 0,
        miscellaneousFee: 0, 
        hostelFee: 0, 
        messFee: 0, 
        completeFee: 0
    });
    setPayments(null);
    setTotalAmount(0);
    setPaidAmount(0);
    setRemainingAmount(0);
    setSearchedBillImageUrl('');
};


  // --- CHANGE END ---

  const incrementReceiptNumber = () => {
    const newNumber = parseInt(receiptNumber) + 1;
    setReceiptNumber(newNumber);
    localStorage.setItem('lastReceiptNumber', newNumber);
  };

  const handleSetReceiptNumber = () => {
    if (!receiptNumber || isNaN(receiptNumber)) {
      console.error('Please enter a valid numeric receipt number');
      return;
    }
    setInitialReceiptSet(true);
    localStorage.setItem('lastReceiptNumber', receiptNumber);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getAcademicYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    if (month >= 3) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

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
    if (parts.length > 0) {
      str += parts.join(' ') + ' Rupees';
    }
    if (paise > 0) {
      str += (str ? ' and ' : '') + getWords(paise) + ' Paise';
    }
    return str.trim() + ' Only';
  };

  const handlePrint = () => {
    if (!initialReceiptSet) {
      console.error('Please set a receipt number first');
      return;
    }
    setShowPrintDialog(true);
  };


  const confirmPrint = (copies) => {
    setShowPrintDialog(false);
    const tuitionDiscount = payments?.discounts?.tuitionDiscount || 0;
    const feeDiscount = payments?.discounts?.feeDiscount || 0;
    const bookDiscount = payments?.discounts?.appliedTo?.includes('Books Fee') ? feeDiscount : 0;
    const printData = {
      receiptNumber,
      studentData,
      tuitionFee,
      tuitionPaid,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMode,
      currentDate: payments?.created_at || new Date(),
      academicYear: getAcademicYear(),
      amountInWords: convertAmountToWords(paidAmount),
      schoolName,
      logoUrl: dynamicLogoSrc || "/default-logo.png",
      examFee,
      busFee,
      bookFee,
      uniformFee,
      othersFee,
      examPaid,
      busPaid,
      bookPaid,
      admissionFee,
      admissionPaid,
      uniformPaid,
      othersPaid,
      discounts: {
        tuitionDiscount,
        bookDiscount
      }
    };
    if (copies === 1) {
      printPendingBills([{ ...printData }]);
    } else if (copies === 2) {
      printPendingBills([
        { ...printData, isTopCopy: true },
        { ...printData, isTopCopy: false }
      ]);
    }
  };
  const [showDiscountBillModal, setShowDiscountBillModal] = useState(false); 

  const openDiscountModal = () => {
    setShowDiscountBillModal(true);
  };

  const closeDiscountModal = () => {
    setShowDiscountBillModal(false);
  };

  const printPendingBills = (billsToPrint) => {
    const updatedBills = [...generatedBills];
    billsToPrint.forEach(billToPrint => {
      const existingIndex = updatedBills.findIndex(bill => bill.receiptNumber === billToPrint.receiptNumber);
      if (existingIndex > -1) {
        updatedBills[existingIndex] = billToPrint;
      } else {
        updatedBills.push(billToPrint);
      }
    });
    setGeneratedBills(updatedBills);
    localStorage.setItem('generatedBills', JSON.stringify(updatedBills));
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Fee Receipts</title> 
              <style>
                @page {
                  size: A4;
                  margin: 0;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                  font-family: Arial, sans-serif;
                }
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  padding: 10px;
                }
                .bill-container {
                  width: 100%;
                  display: flex;
                  gap: 10px;
                }
                .bill-copy {
                  width: 50%;
                  border: 2px solid #000;
                  padding: 10px;
                  font-size: 12px;
                  page-break-inside: avoid;
                  position: relative;
                }
                .header-logo {
                  height: 150px;
                  width: 150px;
                  position: absolute;
                  left: 50%;
                  top: 50%;
                  transform: translate(-50%, -50%);
                  opacity: 0.2;
                  z-index: -1;
                  pointer-events: none;
                }
                .text-center {
                  text-align: center;
                }
                .text-right {
                  text-align: right;
                }
                .bold {
                  font-weight: 900;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 8px 0;
                }
                table, th, td {
                  border: 1px solid #000;
                }
                th, td {
                  padding: 4px;
                }
                .signature-line {
                  margin-top: 20px;
                  border-top: 1px dashed #000;
                  width: 120px;
                  text-align: center;
                  padding-top: 5px;
                  font-size: 10px;
                }
                .discount-text {
                  color: green;
                  font-size: 10px;
                }
                  @media print {
                  body {
                  -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                    .bill-copy, .bill-copy table, .bill-copy p {
                    color: #000000 !important;
                    font-weight: 900 !important;
                  }
                }
              </style>
            </head>
            <body>
              <div class="bill-container">
                ${billsToPrint.map((printData, index) => {
                  const tuitionDiscount = printData.discounts?.tuitionDiscount || 0;
                  const bookDiscount = printData.discounts?.bookDiscount || 0;
                  const currentTuitionBalance = Math.max(printData.tuitionFee - tuitionDiscount - printData.tuitionPaid, 0);
                  const currentExamBalance = Math.max(printData.examFee - printData.examPaid, 0);
                  const currentBusBalance = Math.max(printData.busFee - printData.busPaid, 0);
                  const currentBookBalance = Math.max(printData.bookFee - bookDiscount - printData.bookPaid, 0);
                  const currentUniformBalance = Math.max(printData.uniformFee - printData.uniformPaid, 0);
                  const currentOthersBalance = Math.max(printData.othersFee - printData.othersPaid, 0);
                  const totalAmountDue =
                    (printData.tuitionFee - tuitionDiscount) +
                    printData.examFee +
                    printData.busFee +
                    (printData.bookFee - bookDiscount) +
                    printData.uniformFee +
                    printData.othersFee;
                  const totalPaidAmount =
                    printData.tuitionPaid +
                    printData.examPaid +
                    printData.busPaid +
                    printData.bookPaid +
                    printData.uniformPaid +
                    printData.othersPaid;
                  const totalRemainingAmount = Math.max(totalAmountDue - totalPaidAmount, 0);
                  return `
                    <div class="bill-copy">
                      <img src="${printData.logoUrl}" alt="School Logo" class="header-logo" />
                      <div class="text-center">
                        <h2 class="bold" style="font-size: 14px;">${printData.schoolName || 'Shree Narayana International School'}</h2>
                        <div style="border: 1px solid #000; margin: 3px 0; padding: 2px 0; font-weight: bold; font-size: 12px;">
                          FEES RECEIPT
                        </div>
                      </div>
                      <table>
                        <tbody>
                          <tr>
                            <td><strong>Receipt No.</strong> ${formatReceiptNumber(printData.receiptNumber)}</td>
                            <td class="text-right">
                              <strong> Paid Date:</strong>
                              ${formatDate(
            printData.currentDate || new Date()
          )}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Regn. No.</strong> ${printData.studentData?.rollNumber || 'N/A'}</td>
                            <td class="text-right"><strong>Academic Year:</strong> ${printData.academicYear}</td>
                          </tr>
                          <tr>
                            <td><strong>Student Name:</strong></td>
                            <td class="text-right">${printData.studentData?.name || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td><strong>Father's Name:</strong></td>
                            <td class="text-right">${printData.studentData?.fatherName || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td><strong>Class / Standard:</strong> ${printData.studentData?.class?.toUpperCase() || 'N/A'}</td>
                            <td class="text-right"><strong>Section:</strong> ${printData.studentData?.section || 'A'}</td>
                          </tr>
                        </tbody>
                      </table>
                      <table>
                        <thead>
                          <tr>
                            <th>Fee Details</th>
                            <th>Amount (₹)</th>
                            <th>Paid (₹)</th>
                            <th>Balance (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              Tuition Fee
                              ${tuitionDiscount > 0 ? `<span class="discount-text">(Discount: ₹${tuitionDiscount.toLocaleString('en-IN')})</span>` : ''}
                            </td>
                            <td class="text-right">${(printData.tuitionFee - tuitionDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${printData.tuitionPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${currentTuitionBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td>Admission Fee</td>
                            <td class="text-right">${printData.admissionFee.toLocaleString('en-IN')}</td>
                            <td class="text-right">${printData.admissionPaid.toLocaleString('en-IN')}</td>
                            <td class="text-right">${(printData.admissionFee - printData.admissionPaid).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td>Exam Fee</td>
                            <td class="text-right">${printData.examFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${printData.examPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${currentExamBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td>Bus Fee</td>
                            <td class="text-right">${printData.busFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${printData.busPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${currentBusBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td>
                              Book Fee
                              ${bookDiscount > 0 ? `<span class="discount-text">(Discount: ₹${bookDiscount.toLocaleString('en-IN')})</span>` : ''}
                            </td>
                            <td class="text-right">${(printData.bookFee - bookDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${printData.bookPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${currentBookBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td>Uniform Fee</td>
                            <td class="text-right">${printData.uniformFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${printData.uniformPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${currentUniformBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td>Other Fees</td>
                            <td class="text-right">${printData.othersFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${printData.othersPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${currentOthersBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr style="font-weight: bold; background-color: #f8f8f8;">
                            <td>GRAND TOTAL</td>
                            <td class="text-right">${totalAmountDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="text-right">${totalRemainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="font-style: italic; margin-top: 3px; font-size: 10px;">
                        paid amount: ${convertAmountToWords(totalPaidAmount)}
                      </p>
                      <div style="margin-top: 10px; font-size: 11px;">
                        <p><strong>Payment Mode:</strong> ${printData.paymentMode || 'Cash/Cheque/Online'}</p>
                        ${(printData.paymentMode === 'Cheque' || printData.paymentMode === 'Online') ? `
                          <p><strong>Cheque/Transaction No.:</strong> ___________________</p>
                          <p><strong>Bank Name:</strong> ___________________</p>
                        ` : ''}
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                        <div class="signature-line">Parent's Signature</div>
                        <div class="signature-line">Accountant</div>
                      </div>
                      <div class="signature-line" style="margin-left: auto; margin-right: auto;">Principal</div>
                      <div style="margin-top: 5px; font-size: 8px; text-align: center;">
                        <p>This is a computer generated receipt. No signature required.</p>
                        <p>Please bring this receipt for any fee related queries.</p>
                      </div>
                    </div>
                  `;
                }).join('')}
                ${billsToPrint.length === 1 ? '<div class="bill-copy" style="border: none;"></div>' : ''}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    window.close();
                  }, 200);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }, 100);
  };

   const handleDownload = async () => {
    if (!initialReceiptSet || !studentData) {
      console.error('Please set a receipt number and select a student first');
      return;
    }
    const tuitionDiscount = payments?.discounts?.tuitionDiscount || 0;
    const feeDiscount = payments?.discounts?.feeDiscount || 0;
    const bookDiscount = payments?.discounts?.appliedTo?.includes('Books Fee') ? feeDiscount : 0;
    const receiptDiv = document.createElement('div');
    receiptDiv.id = 'receipt-container';
    
    const currentTuitionBalance = Math.max(tuitionFee - tuitionDiscount - tuitionPaid, 0);
    const currentExamBalance = Math.max(examFee - examPaid, 0);
    const currentBusBalance = Math.max(busFee - busPaid, 0);
    const currentBookBalance = Math.max(bookFee - bookDiscount - bookPaid, 0);
    const currentUniformBalance = Math.max(uniformFee - uniformPaid, 0);
    const currentOthersBalance = Math.max(othersFee - othersPaid, 0);
    const totalAmountDue =
      (tuitionFee - tuitionDiscount) +
      examFee +
      busFee +
      (bookFee - bookDiscount) +
      uniformFee +
      othersFee +
      admissionFee;
    const totalPaidAmount =
      tuitionPaid +
      examPaid +
      busPaid +
      bookPaid +
      uniformPaid +
      othersPaid +
      admissionPaid;
    const totalRemainingAmount = Math.max(totalAmountDue - totalPaidAmount, 0);
    
    // --- CHANGE MADE HERE ---
    // The student info table has been restructured to match the desired 2-column layout.
    receiptDiv.innerHTML = `
      <div style="border: 2px solid black; padding: 10px; width: 280px; background-color: white; box-sizing: border-box;">
          <div style="display: flex; align-items: center; margin-bottom: 0.25rem;">
              <div style="width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-right: 10px;">
                  <img src="${dynamicLogoSrc || 'https://via.placeholder.com/40'}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <div style="flex: 1; text-align: center;">
                  <h1 style="font-size: 1rem; font-weight: 700; color: #1e40af; margin-bottom: 0.1rem;">
                      ${schoolName || 'TAGSOLNOVALLP School'}
                  </h1>
                  <div style="color: black; margin: 3px 0; padding: 2px 0; font-weight: bold; font-size: 10px;">
                      FEES RECEIPT
                  </div>
              </div>
          </div>
          <table id="student-info-table" style="width: 100%; margin-bottom: 0.1rem; font-size: 9px; border-collapse: collapse;">
              <tbody>
                  <tr>
                    <td style="text-align: left; padding: 1px;"><strong>Receipt No:</strong> ${formatReceiptNumber(receiptNumber)}</td>
                    <td style="text-align: right; padding: 1px;"><strong>Paid Date:</strong> ${formatDate(new Date())}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left; padding: 1px;"><strong>Regn.No:</strong> ${studentData.rollNumber}</td>
                    <td style="text-align: right; padding: 1px;"><strong>Academic Year:</strong> ${getAcademicYear()}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left; padding: 1px;"><strong>Student Name:</strong> ${studentData.name}</td>
                    <td style="text-align: right; padding: 1px;"><strong>Father Name:</strong> ${studentData.fatherName}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left; padding: 1px;"><strong>Class:</strong> ${studentData.class.toUpperCase()}</td>
                    <td style="text-align: right; padding: 1px;"><strong>Section:</strong> ${studentData.section}</td>
                  </tr>
              </tbody>
          </table>
          <table style="width: 100%; border: 1px solid black; border-collapse: collapse; margin-bottom: 0.25rem; font-size: 9px;">
              <thead>
                  <tr style="background-color: #f0f0f0;"><th style="border: 1px solid black; padding: 3px; text-align: left;">Fee Details</th><th style="border: 1px solid black; padding: 3px; text-align: right;">Amount (₹)</th><th style="border: 1px solid black; padding: 3px; text-align: right;">Paid (₹)</th><th style="border: 1px solid black; padding: 3px; text-align: right;">Balance (₹)</th></tr>
              </thead>
              <tbody>
                  <tr><td style="border: 1px solid black; padding: 3px;">Tuition Fee</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${tuitionFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${tuitionPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${currentTuitionBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="border: 1px solid black; padding: 3px;">Admission Fee</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${admissionFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${admissionPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${(admissionFee - admissionPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="border: 1px solid black; padding: 3px;">Exam Fee</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${examFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${examPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${currentExamBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="border: 1px solid black; padding: 3px;">Bus Fee</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${busFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${busPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${currentBusBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="border: 1px solid black; padding: 3px;">Book Fee</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${bookFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${bookPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${currentBookBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="border: 1px solid black; padding: 3px;">Uniform Fee</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${uniformFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${uniformPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${currentUniformBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="border: 1px solid black; padding: 3px;">Other Fees</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${othersFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${othersPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${currentOthersBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
                  <tr style="font-weight: bold; background-color: #f8f8f8;"><td style="border: 1px solid black; padding: 3px;">GRAND TOTAL</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${totalAmountDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="border: 1px solid black; padding: 3px; text-align: right;">${totalRemainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              </tbody>
          </table>
          <p style="font-style: italic; margin-top: 3px; font-size: 10px; font-weight: bold;">paid amount: ${convertAmountToWords(totalPaidAmount)}</p>
          <div style="margin-top: 10px; font-size: 10px; font-weight: bold;">
              <p>Payment Mode: ${paymentMode || 'Cash/Cheque/Online'}</p>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 25px; font-size: 10px; font-weight: bold;">
              <div style="border-top: 1px dashed #000; width: 100px; text-align: center; padding-top: 3px">Parent's Signature</div>
              <div style="border-top: 1px dashed #000; width: 100px; text-align: center; padding-top: 3px">Accountant</div>
          </div>
          <div style="border-top: 1px dashed #000; width: 100px; text-align: center; padding-top: 3px; margin: 15px auto 5px auto; font-size: 10px; font-weight: bold;">Principal</div>
      </div>
    `;

    // The rest of the function remains unchanged and will correctly render this new HTML structure
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    try {
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write('<!DOCTYPEhtml><html><head><meta charset="UTF-8"></head><body></body></html>');
        iframeDoc.close();
        
        const contentToRender = receiptDiv.firstElementChild;
        iframeDoc.body.appendChild(contentToRender);
        iframeDoc.body.style.margin = '0';

        const style = iframeDoc.createElement('style');
        style.innerHTML = `
            * {
                font-family: Arial, sans-serif !important;
                -webkit-font-smoothing: none !important;
                font-smooth: never !important;
                text-rendering: geometricPrecision !important;
            }
            body, p, td, th, div { color: #000 !important; }
            h1 { color: #1e40af !important; font-weight: 700 !important; }
            table, th, td { border-color: #000 !important; }
            
            #student-info-table td {
                font-weight: 400 !important;
            }

            #student-info-table strong {
                font-weight: 700 !important;
            }
            
            table:not(#student-info-table) {
                font-weight: 900 !important;
            }
        `;
        iframeDoc.head.appendChild(style);

        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(contentToRender, {
            scale: 3,
            backgroundColor: '#FFFFFF',
            useCORS: true,
            letterRendering: true,
        });

        const pdfWidth = 80;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pdf = new jsPDF({
            orientation: pdfHeight > pdfWidth ? 'p' : 'l',
            unit: 'mm',
            format: [pdfWidth, pdfHeight],
            hotfixes: ['px_scaling']
        });

        pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Fee_Receipt_${receiptNumber}_${studentData?.name || 'student'}.pdf`);

        const billData = {
          receiptNumber, studentData, tuitionFee, tuitionPaid, examFee, examPaid, busFee, busPaid, bookFee, bookPaid,
          uniformFee, uniformPaid, othersFee, othersPaid, totalAmount: totalAmountDue, paidAmount: totalPaidAmount,
          remainingAmount: totalRemainingAmount, paymentMode, currentDate: new Date(), academicYear: getAcademicYear(),
          amountInWords: convertAmountToWords(totalPaidAmount), schoolName, discounts: { tuitionDiscount, bookDiscount }
        };
        const updatedBills = [...generatedBills];
        const existingIndex = updatedBills.findIndex(bill => bill.receiptNumber === billData.receiptNumber);
        if (existingIndex > -1) updatedBills[existingIndex] = billData;
        else updatedBills.push(billData);
        setGeneratedBills(updatedBills);
        localStorage.setItem('generatedBills', JSON.stringify(updatedBills));

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to download PDF. Please try again.');
    } finally {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }
};

  const formatReceiptNumber = (receiptNumber) => {
    const yearPosition = localStorage.getItem('yearPosition');
    const receiptYear = localStorage.getItem('receiptYear') || ''; 
    const receiptPrefix = localStorage.getItem('receiptPrefix') || '';
    const receiptSuffix = localStorage.getItem('receiptSuffix') || '';
    if (yearPosition === 'before') {
      return `${receiptYear}${receiptPrefix}${receiptNumber}${receiptSuffix}`;
    } else {
      return `${receiptPrefix}${receiptNumber}${receiptSuffix}${receiptYear}`;
    }
  };

  const previewOptions = [
    { value: 1, label: 'Preview: 1 Copy' },
    { value: 2, label: 'Preview: 2 Copies' },
    { value: 4, label: 'Preview: 4 Copies' }
  ];

  const printOptions = [
    { value: 1, label: 'Print 1 Sheet (2 Copies)' }
  ];

  const getPreviewDisplayName = (mode) => {
    return `Preview: ${mode} Copy${mode > 1 ? 'ies' : ''}`;
  };

  return (
    <div style={{ minHeight: '100vh', padding: '1rem', backgroundColor: 'white' }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>Receipt</h1>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            {!localStorage.getItem('lastReceiptNumber') && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Enter Starting Receipt Number
                  </label>
                  <input
                    type="number"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    placeholder="Enter starting receipt number"
                  />
                </div>
                <button
                  onClick={handleSetReceiptNumber}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', height: 'fit-content', marginBottom: '0.5rem' }}>
                  Set Receipt Number
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '290px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Search Previous Bill by Receipt Number
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    placeholder="Enter receipt number"
                  />
                  <button
                    onClick={searchBillsByReceiptNumber}
                    disabled={isSearching}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#5a7488', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', opacity: isSearching ? 0.7 : 1 }}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', minWidth: '200px', fontSize: '14px' }}>
                <span style={{ fontWeight: '500', fontSize: '14px' }}>Receipt No:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {localStorage.getItem('yearPosition') === 'before' && localStorage.getItem('receiptYear')}
                  {localStorage.getItem('receiptPrefix') || ''}
                  {receiptNumber}
                  {localStorage.getItem('receiptSuffix') || ''}
                  {localStorage.getItem('yearPosition') === 'after' && localStorage.getItem('receiptYear')}
                </span>
              </div>  
            </div> 

            {/* --- CHANGE START --- */}
            {/* 3. ADD JSX TO DISPLAY THE FOUND IMAGE */}
            {/* This block will only appear when `searchedBillImageUrl` has a value. */}
            {searchedBillImageUrl && (
                <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                    Found Receipt Image
                </h3>
                <div style={{ textAlign: 'center' }}>
                    <img 
                    src={searchedBillImageUrl} 
                    alt={`Receipt for number ${searchTerm}`} 
                    style={{ 
                        maxWidth: '350px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '0.375rem' 
                    }} 
                    />
                </div>
                </div>
            )}
            {/* --- CHANGE END --- */}

     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
  <div style={{ flex: 1, minWidth: '200px' }}>
    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
      Select Class
    </label>
    <select
      value={selectedClass}
      onChange={(e) => setSelectedClass(e.target.value)}
      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
      disabled={isEditing}>
      {["Nursery", "LKG", "UKG", ...Array.from({ length: 10 }, (_, i) => `class${i + 1}`)].map(cls => (
        <option key={cls} value={cls}>{cls.toUpperCase()}</option>
      ))}
    </select>
  </div>
  <div style={{ flex: 1, minWidth: '200px' }}>
    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
      Select Student
    </label>
    <select
      value={selectedStudentId ?? ''}
      onChange={(e) => setSelectedStudentId(Number(e.target.value))}
      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
      disabled={isEditing}>
      <option value="" disabled>Select student</option>
      {Array.isArray(students) && students.map(student => (
        <option key={student.id} value={student.id}>
          {student.name} (ID: {student.id})
        </option>
      ))}
    </select>
  </div>

</div>
          </div>
        </div>
        {initialReceiptSet && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>Preview</h2>
              {studentData?.name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowPreviewDropdown(!showPreviewDropdown)}
                      style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      <Filter style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                      <span>{getPreviewDisplayName(previewMode)}</span>
                    </button>
                    {showPreviewDropdown && (
                      <div style={{ position: 'absolute', right: '0', top: '100%', marginTop: '0.25rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: '10', minWidth: '180px' }}>
                        {previewOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setPreviewMode(option.value);
                              setShowPreviewDropdown(false);
                            }}
                            style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: previewMode === option.value ? '#eff6ff' : 'transparent', color: previewMode === option.value ? '#2563eb' : '#374151', border: 'none', cursor: 'pointer' }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={toggleEditMode}
                    style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', backgroundColor: isEditing ? '#ef4444' : '#5a7488', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    {isEditing ? (
                      <>
                        <X style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                        Edit
                      </>
                    )}
                  </button>
                  {isEditing ? (
  <button
    onClick={saveEditedBill}
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem 1rem',
      backgroundColor: '#5a7488',
      color: 'white',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '0.875rem',
      cursor: 'pointer',
    }}
  >
    <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
    Save
  </button>
) : (
  <>
    <button
      onClick={handlePrint}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: '#5a7488',
        color: 'white',
        borderRadius: '0.5rem',
        border: 'none',
        fontSize: '0.875rem',
        cursor: 'pointer',
        marginRight: '0.5rem',
      }}
    >
      <Printer style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
      Print
    </button>
    <button
      onClick={handleDownload}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: '#5a7488',
        color: 'white',
        borderRadius: '0.5rem',
        border: 'none',
        fontSize: '0.875rem',
        cursor: 'pointer',
        marginRight: '0.5rem',
      }}
    >
      <Download style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
      Download
    </button>


  </>
)}

                </div>
              )}
            </div>
            {studentData?.name ? (
              <div id="bill-preview-content" style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', fontFamily: 'Arial, sans-serif', fontSize: '10px' }}>
              <div style={{ border: '1px solid black', padding: '10px', width: '300px', position: 'relative', backgroundColor: 'white', color: '#000000', fontWeight: '900' }}>
                  {isEditing && (
                    <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '8px', fontWeight: 'bold' }}>
                      EDIT MODE
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' , color: 'black', fontWeight: '900' }}>
                    <div style={{ width: '40px', height: '40px', border: '2px solid white', borderRadius: '6px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: '10px'}}>
                      <img
                        src={dynamicLogoSrc || 'https://via.placeholder.com/40'}
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <h1 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.1rem' }}>
                        {schoolName || 'School Name'}
                      </h1>
                      <div style={{ margin: '3px 0', padding: '2px 0', fontWeight: 'bold', fontSize: '10px' }}>FEES RECEIPT</div>
                    </div>
                  </div>
                  <table style={{ width: '100%', marginBottom: '0.1rem', fontSize: '10px', color: 'black', fontWeight: '900' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Receipt No:</strong>
                          <span style={{ fontWeight: 'bold' }}>
                            {formatReceiptNumber(receiptNumber)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Paid Date:</strong>
                          {` ${payments?.paymentDate || payments?.created_at || payments?.paymentHistory?.[0]?.paymentDate
                            ? formatDate(new Date(
                              payments.paymentDate ||
                              payments.created_at ||
                              payments.paymentHistory[0].paymentDate
                            ))
                            : 'No payment date available'}`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Regn.No:</strong>
                          {` ${studentData.rollNumber}`}
                        </td>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Academic Year:</strong>
                          {` ${getAcademicYear()}`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', width: '50%', fontSize: '10px' }}>
                          <strong>Student Name:</strong>
                          {` ${studentData.name}`}
                        </td>
                        <td style={{ textAlign: 'left', width: '50%', fontSize: '10px' }}>
                          <strong>Father Name:</strong>
                          {` ${studentData.fatherName}`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Class:</strong>
                          {` ${studentData.class.toUpperCase()}`}
                        </td>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Section:</strong>
                          {` ${studentData.section}`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', marginBottom: '0.25rem', fontSize: '10px', color: 'black', fontWeight: '900' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid black', padding: '3px', textAlign: 'left', backgroundColor: '#f0f0f0' }}>Fee Details</th>
                        <th style={{ border: '1px solid black', padding: '3px', textAlign: 'right', backgroundColor: '#f0f0f0' }}>Amount (₹)</th>
                        <th style={{ border: '1px solid black; padding: 3px; text-align: right; backgroundColor: #f0f0f0' }}>Paid (₹)</th>
                        <th style={{ border: '1px solid black', padding: '3px', textAlign: 'right', backgroundColor: '#f0f0f0' }}>Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>Tuition Fee</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{(tuitionFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editableBill?.tuitionPaid || 0}
                              onChange={(e) => handleEditChange('tuitionPaid', e.target.value)}
                              style={{ width: '60px', padding: '2px', textAlign: 'right', border: '1px solid #ccc', fontSize: '10px' }}
                            />
                          ) : (
                            `₹${(tuitionPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          )}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{Math.max((tuitionFee || 0) - (isEditing ? (parseFloat(editableBill?.tuitionPaid) || 0) : tuitionPaid), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>
                          Admission Fee
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {`₹${(admissionFee || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}`}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {`₹${(parseFloat(admissionPaid) || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}`}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {`₹${Math.max(
                            (admissionFee || 0) - (parseFloat(admissionPaid) || 0),
                            0
                          ).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>Exam Fee</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{(examFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editableBill?.examPaid || 0}
                              onChange={(e) => handleEditChange('examPaid', e.target.value)}
                              style={{ width: '60px', padding: '2px', textAlign: 'right', border: '1px solid #ccc', fontSize: '10px' }}
                            />
                          ) : (
                            `₹${(examPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          )}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{Math.max((examFee || 0) - (isEditing ? (parseFloat(editableBill?.examPaid) || 0) : examPaid), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>Bus Fee</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{(busFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editableBill?.busPaid || 0}
                              onChange={(e) => handleEditChange('busPaid', e.target.value)}
                              style={{ width: '60px', padding: '2px', textAlign: 'right', border: '1px solid #ccc', fontSize: '10px' }}
                            />
                          ) : (
                            `₹${(busPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          )}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{Math.max((busFee || 0) - (isEditing ? (parseFloat(editableBill?.busPaid) || 0) : busPaid), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>Book Fee</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{(bookFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editableBill?.bookPaid || 0}
                              onChange={(e) => handleEditChange('bookPaid', e.target.value)}
                              style={{ width: '60px', padding: '2px', textAlign: 'right', border: '1px solid #ccc', fontSize: '10px' }}
                            />
                          ) : (
                            `₹${(bookPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          )}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{Math.max((bookFee || 0) - (isEditing ? (parseFloat(editableBill?.bookPaid) || 0) : bookPaid), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>Uniform Fee</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{(uniformFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editableBill?.uniformPaid || 0}
                              onChange={(e) => handleEditChange('uniformPaid', e.target.value)}
                              style={{ width: '60px', padding: '2px', textAlign: 'right', border: '1px solid #ccc', fontSize: '10px' }}
                            />
                          ) : (
                            `₹${(uniformPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          )}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{Math.max((uniformFee || 0) - (isEditing ? (parseFloat(editableBill?.uniformPaid) || 0) : uniformPaid), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>Other Fees</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{(othersFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editableBill?.othersPaid || 0}
                              onChange={(e) => handleEditChange('othersPaid', e.target.value)}
                              style={{ width: '60px', padding: '2px', textAlign: 'right', border: '1px solid #ccc', fontSize: '10px' }}
                            />
                          ) : (
                            `₹${(othersPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          )}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          ₹{Math.max((othersFee || 0) - (isEditing ? (parseFloat(editableBill?.othersPaid) || 0) : othersPaid), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f8f8' }}>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>GRAND TOTAL</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {`₹${((tuitionFee || 0) + (examFee || 0) + (busFee || 0) + (bookFee || 0) + (uniformFee || 0) + (othersFee || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {`₹${((isEditing ? (parseFloat(editableBill?.tuitionPaid) || 0) : tuitionPaid) + (isEditing ? (parseFloat(editableBill?.examPaid) || 0) : examPaid) + (isEditing ? (parseFloat(editableBill?.busPaid) || 0) : busPaid) + (isEditing ? (parseFloat(editableBill?.bookPaid) || 0) : bookPaid) + (isEditing ? (parseFloat(editableBill?.uniformPaid) || 0) : uniformPaid) + (isEditing ? (parseFloat(editableBill?.othersPaid) || 0) : othersPaid)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                          {`₹${Math.max(
                            ((tuitionFee || 0) + (examFee || 0) + (busFee || 0) + (bookFee || 0) + (uniformFee || 0) + (othersFee || 0)) -
                            ((isEditing ? (parseFloat(editableBill?.tuitionPaid) || 0) : tuitionPaid) + (isEditing ? (parseFloat(editableBill?.examPaid) || 0) : examPaid) + (isEditing ? (parseFloat(editableBill?.busPaid) || 0) : busPaid) + (isEditing ? (parseFloat(editableBill?.bookPaid) || 0) : bookPaid) + (isEditing ? (parseFloat(editableBill?.uniformPaid) || 0) : uniformPaid) + (isEditing ? (parseFloat(editableBill?.othersPaid) || 0) : othersPaid)),
                            0
                          ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ fontStyle: 'italic', marginTop: '3px', fontSize: '10px' }}>
                    paid amount: {convertAmountToWords(isEditing ?
                      ((parseFloat(editableBill?.tuitionPaid) || 0) + (parseFloat(editableBill?.examPaid) || 0) + (parseFloat(editableBill?.busPaid) || 0) +
                        (parseFloat(editableBill?.bookPaid) || 0) + (parseFloat(editableBill?.uniformPaid) || 0) + (parseFloat(editableBill?.othersPaid) || 0)) : paidAmount)}
                  </p>
                  <div style={{ marginTop: '10px', fontSize: '10px' }}>
                    <p><strong>Payment Mode:</strong></p>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '10px' }}>
                        <label>
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Cash"
                            checked={editableBill?.paymentMode === 'Cash'}
                            onChange={() => handleEditChange('paymentMode', 'Cash')}
                            style={{ marginRight: '3px' }}
                          />
                          Cash
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Cheque"
                            checked={editableBill?.paymentMode === 'Cheque'}
                            onChange={() => handleEditChange('paymentMode', 'Cheque')}
                            style={{ marginRight: '3px' }}
                          />
                          Cheque
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Online"
                            checked={editableBill?.paymentMode === 'Online'}
                            onChange={() => handleEditChange('paymentMode', 'Online')}
                            style={{ marginRight: '3px' }}
                          />
                          Online
                        </label>
                      </div>
                    ) : (
                      <p>{paymentMode || 'Cash/Cheque/Online'}</p>
                    )}
                    {(paymentMode === 'Cheque' || paymentMode === 'Online') && (
                      <div style={{ marginTop: '5px', fontSize: '10px' }}>
                        <p><strong>Cheque/Transaction No.:</strong> ___________________</p>
                        <p><strong>Bank Name:</strong> ___________________</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '10px' }}>
                    <div style={{ borderTop: '1px dashed #000', width: '100px', textAlign: 'center', paddingTop: '3px' }}>
                      Parent's Signature
                    </div>
                    <div style={{ borderTop: '1px dashed #000', width: '100px', textAlign: 'center', paddingTop: '3px' }}>
                      Accountant
                    </div>
                  </div>
                  <div style={{ borderTop: '1px dashed #000', width: '100px', textAlign: 'center', paddingTop: '3px', margin: '5px auto', fontSize: '10px' }}>
                    Principal
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <FileText style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: '0.5' }} />
                <p style={{ fontSize: '1rem' }}>Select a student to preview the bill</p>
              </div>
            )}
          </div>
        )}
        {showPrintDialog && (
          <div style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '50' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '400px', width: '100%' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Print Options</h3>
              <p style={{ marginBottom: '1.5rem' }}>How many copies would you like to print?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => confirmPrint(1)}
                  style={{ padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  Print 1 Copy
                </button>
                <button
                  onClick={() => confirmPrint(2)}
                  style={{ padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  2 Copies
                </button>
              </div>
              <button
                onClick={() => setShowPrintDialog(false)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
     <PopupModal
        isOpen={showDiscountBillModal}
        onClose={closeDiscountModal}
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          borderRadius: 0,
          height: '100vh'
        }}
        contentStyle={{
          padding: 0,
          height: '100%'
        }}
      >
        {/* <DiscountedStudents
          onClose={closeDiscountModal}
          style={{
            width: '100%',
            height: '100%'
          }}
        /> */}
      </PopupModal>

      {/* --- NEW SUCCESS POP-UP MODAL --- */}
      <PopupModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div style={{ textAlign: 'center', padding: '1rem' }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="green" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ margin: '0 auto 1rem' }}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Success!</h2>
            <p style={{ color: '#374151' }}>{successMessage}</p>
        </div>
      </PopupModal>
      </div>
    </div>
  );
};

export default GenerateBillPrint;
const PopupModal = ({ isOpen, onClose, children, style, contentStyle }) => {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
        boxSizing: "border-box",
        cursor: "pointer",
        ...style
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "8px",
          width: "auto", // Changed to auto for better fitting
          minWidth: "300px", // Set a minimum width
          maxWidth: "500px", // Set a maximum width
          boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
          cursor: "auto",
          ...contentStyle
        }}
      >
        {children}
        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            cursor: "pointer",
            display: "block", 
            marginLeft: "auto", 
            marginRight: "auto",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            fontWeight: "500"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};