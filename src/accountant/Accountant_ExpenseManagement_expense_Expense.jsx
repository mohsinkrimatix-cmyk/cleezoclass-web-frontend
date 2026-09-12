import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
// NEW IMPORT: Component to create master categories/expenses
import CreateMasterExpenseForm from './ExpensesAccountant'; 
import ErrorPopup from '../shared/ErrorPopup';

// ====================================================================
// ExpenseForm Component (Step 2: Create Form) - INLINE
// ====================================================================
const ExpenseForm = ({ initialData, onClose, onExpenseCreated, onBack, setPopup }) => {
    const [expenseCategory, setExpenseCategory] = useState(''); 
    const [specificExpenseName, setSpecificExpenseName] = useState(''); 
   
    const [description, setDescription] = useState('');
    const [paymentMode, setPaymentMode] = useState('BANK');
    const [totalAmount, setTotalAmount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [balance, setBalance] = useState('');
    const [personName, setPersonName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [price, setPrice] = useState('');

    const styles = { 
        formContainer: { width: '100%', padding: '10px', borderRadius: '8px', fontFamily: 'sans-serif', backgroundColor: '#fff', border: '1px solid #ced4da', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', paddingTop:'0' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
        headerLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
        backButton: { cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', padding: 0, color: '#333' },
        title: { fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#333' },
        formGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '12px', color: '#555' },
        input: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
        textarea: { width: '100%', padding: '10px', boxSizing: 'border-box', minHeight: '60px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
        select: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: '#fff' },
        button: { width: '100%', backgroundColor: '#28a745', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }
    };


    useEffect(() => {
        if (initialData) {
            setExpenseCategory(initialData.expenseCategory || '');
            setSpecificExpenseName(initialData.specificExpenseName || '');
            setDescription(initialData.description || '');
            setPersonName(initialData.name || '');
            setMobileNumber(initialData.mobileNumber || '');
            setPrice(initialData.price || '');
        }
    }, [initialData]);

    useEffect(() => {
        let total = parseFloat(totalAmount);
        let paid = parseFloat(paidAmount);
        if (isNaN(total)) total = 0;
        if (isNaN(paid)) paid = 0;
        if (paid > total) {
            setPaidAmount(total.toString());
            paid = total;
        }
        setBalance((total - paid).toFixed(2));
    }, [totalAmount, paidAmount]);

const handleSubmit = async (event) => {
  event.preventDefault();
  const schoolCode = localStorage.getItem('schoolCode');

  if (!schoolCode) {
    setPopup({ message: "❌ School code not found!", type: "error" });
    return;
  }

  const expenseData = {
    expenseName: specificExpenseName,
    expenseType: expenseCategory,
    description,
    paymentMode,
    totalAmount: parseFloat(totalAmount) || 0,
    paidAmount: parseFloat(paidAmount) || 0,
    balance: parseFloat(balance) || 0,
    personName,
    mobileNumber,
    price: parseFloat(price) || 0,
    schoolCode,
  };

  try {
    const response = await axios.post(
      'https://cleezoclass.com:4000/Accountntdata',
      expenseData
    );

    setPopup({ message: "✅ Expense created successfully!", type: "success" });

    // Delay so popup is visible before screen changes
    setTimeout(() => {
      onExpenseCreated();
    }, 800);

  } catch (error) {
    console.error('❌ Error submitting expense:', error);

    setPopup({
      message: error.response?.data?.message || "❌ Failed to create expense!",
      type: "error"
    });
  }
};


    return (
        <div style={styles.formContainer}>
            <div style={styles.header}>
               
            </div>
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 15px' }}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Expense Type</label>
                        <input type="text" value={expenseCategory}className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
 readOnly />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Expense Name</label>
                        <input type="text" value={specificExpenseName} className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
 required readOnly />
                    </div>
                    <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                        <label style={styles.label}>Description</label>
                        <textarea value={description} className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
 required readOnly />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Payment Mode</label>
                        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
>
                            <option value="BANK">BANK</option><option value="CASH">CASH</option><option value="UPI">UPI</option><option value="CHECK">CHECK</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Total Amount</label>
                        <input type="number" value={totalAmount} max="999999" onChange={(e) => setTotalAmount(e.target.value)} className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
 required />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Paid</label>
                        <input type="number" value={paidAmount} max="999999" onChange={(e) => setPaidAmount(e.target.value)} className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
required />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Balance</label>
                        <input type="text" value={balance}className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
 readOnly />
                    </div>
                </div>
                <button type="submit"    className="btn-solid"
>Submit Expense</button>
            </form>

        </div>
    );
};


const AddExpenseForm = ({ onSubmit, onCancel, setPopup }) => {
    const [expenseCategory, setExpenseCategory] = useState('Maintenance Services');
    const [specificExpenseName, setSpecificExpenseName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');

    const styles = { 
        formContainer: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '100%', border: '1px solid #ced4da', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
        title: { fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#333' },
        formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 15px' },
        formGroup: { marginBottom: '15px' },
        fullWidth: { gridColumn: '1 / -1' },
        label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '12px', color: '#555' },
        input: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
        textarea: { width: '100%', padding: '10px', boxSizing: 'border-box', minHeight: '60px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical' },
        submitButton: { width: '100%', padding: '10px', backgroundColor: '#5a7488', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }
    };

    const expenseOptions = {
        "Maintenance Services": ["Building Maintenance and Repair", "Furniture Repair", "Electrical & Plumbing Services", "Gardening and Landscaping Services", "Fire Safety Maintenance", "Pest Control"],
        "Digital & IT Services": ["Internet Services", "IT support & Maintenance (Hardware/Software)", "Digital Learning tools (Byru's, Google Classrooms)", "Website Maintenance & Hosting Services", "Smart Class setup and AMC (Annual Maintenance Contract)"],
        "Transport-related Services": ["Vehicle Maintenance & Repair", "Fuel & Oil Services", "GPS Tracking System Services", "Transport Contract Services (if outsourced)"],
        "Administrative Financial Services": ["Accounting and Auditing Services", "Legal and Compliance Services", "Document Printing and Photocopying Services", "Courier & Postage Services", "Office Supplies Procurement Services"],
        "Health & Safety Services": ["Medical Checkup Camps", "First Aid & Emergency Care Supplies", "Health Insurance (if provided to Staff)", "Sanitization and Hygiene Services"]
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    if (!specificExpenseName) {
  setPopup({ message: "⚠️ Please select a specific Expense Name.", type: "error" });
  return;
}

        onSubmit({
            expenseCategory: expenseCategory,
            specificExpenseName: specificExpenseName,
            description,
            mobileNumber,
            name,
            price
        });
    };
const predefinedOptions = {
    "Maintenance Services": [
      "Building Maintenance and Repair",
      "Furniture Repair",
      "Electrical & Plumbing Services",
      "Gardening and Landscaping Services",
      "Fire Safety Maintenance",
      "Pest Control"
    ],
    "Digital & IT Services": [
      "Internet Services",
      "IT support & Maintenance",
      "Digital Learning tools",
      "Website Maintenance",
      "Smart Class AMC"
    ],
    "Transport-related Services": [
      "Vehicle Maintenance & Repair",
      "Fuel & Oil Services",
      "GPS Tracking System Services",
      "Transport Contract Services"
    ],
    "Administrative Financial Services": [
      "Accounting and Auditing Services",
      "Legal and Compliance Services",
      "Document Printing and Photocopying Services",
      "Courier & Postage Services",
      "Office Supplies Procurement Services"
    ],
    "Health & Safety Services": [
      "Medical Checkup Camps",
      "First Aid & Emergency Care Supplies",
      "Health Insurance",
      "Sanitization and Hygiene Services"
    ]
  };

  const [dynamicOptions, setDynamicOptions] = useState({}); // fetched from backend


  const [newCategory, setNewCategory] = useState("");
  const [newExpenseName, setNewExpenseName] = useState("");

  // Fetch dynamic options from backend
const fetchDynamicOptions = async () => {
  const schoolCode = localStorage.getItem("schoolCode"); // ⬅️ get schoolCode

  const res = await fetch(
    `https://cleezoclass.com:4000/api/admin/get-expense-master?schoolCode=${schoolCode}`
  );

  const data = await res.json();
  setDynamicOptions(data);
};

  useEffect(() => {
    fetchDynamicOptions();
  }, []);
      // Style definitions
    const inputStyle = {
        padding: "4px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        width: '100px',
        marginBottom: '5px',
        fontSize:  '14px',
    };
        const [isLoading, setIsLoading] = useState(false); 
      const combinedOptions = { ...predefinedOptions, ...dynamicOptions };
const isFormValid =
  expenseCategory &&
  specificExpenseName &&
  description.trim();
    return (
        <div style={styles.formContainer}>
           
            <form onSubmit={handleSubmit}>
                <div style={styles.formGrid}>
                    {/* Expense Type */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Expense Type</label>
    <select
      value={expenseCategory}
      onChange={(e) => {
        setExpenseCategory(e.target.value);
        setSpecificExpenseName(""); // reset dependent dropdown
      }}
className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
   disabled={isLoading}
      required
    >
       <option value="">-- Select Category --</option>
          {Object.keys(combinedOptions).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
                    </div>

                    {/* Expense Name (Dependent Dropdown) */}
            {/* Expense Name (Dependent Dropdown) */}
<div style={styles.formGroup}>
  <label style={styles.label}>Expense Name</label>
  <select
    value={specificExpenseName}
    onChange={(e) => setSpecificExpenseName(e.target.value)}
className="btn-dropdown-FeesManagement" style={{ width: '100%' }}
     required
    disabled={!expenseCategory}
  >
    <option value="" disabled>-- Select an option --</option>
    {combinedOptions[expenseCategory]?.map((name) => (
      <option key={name} value={name}>{name}</option>
    ))}
  </select>
</div>


                    {/* Name */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Name (Optional)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength="30"
className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
                        />
                    </div>

                    {/* Mobile Number */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Mobile Number (Optional)</label>
                        <input
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength="10"
className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}
                         />
                    </div>

                    {/* Description */}
<div style={styles.formGroup}>
    <label style={styles.label}>Description</label>
    <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength="250"
        className="btn-dropdown-FeesManagement"
        style={{ width: '100%' }}
        required
    />
</div>

{/* Price */}
<div style={styles.formGroup}>
    <label style={styles.label}>Price (Optional)</label>
    <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        max="999999"
        className="btn-dropdown-FeesManagement"
        style={{ width: '100%' }}
    />
</div>

                </div>

                {/* Submit Button */}
<button
  type="submit"
  className="btn-solid"
  disabled={!isFormValid}
  style={{
    opacity: isFormValid ? 1 : 0.5,
    cursor: isFormValid ? "pointer" : "not-allowed"
  }}
>
  Next: Add Payment
</button>
            </form>
        </div>
    );
};


const ExpenseTrackerUI = ({ expenseCategory, expenseType }) => {

  useEffect(() => {
    console.log("Popup opened!");
    console.log("Expense Category:", expenseCategory);
    console.log("Expense Type:", expenseType);
  }, []); // runs once when component mounts

     // --- State Variables ---
    const [expensesData, setExpensesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
    
    // UPDATED: Single state to manage the current view: 'table', 'step1', 'step2', 'create_master'
    const [currentView, setCurrentView] = useState('table'); 
    const [expenseFormData, setExpenseFormData] = useState(null);

    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const [fromDate, setFromDate] = useState(formatDate(oneMonthAgo));
    const [toDate, setToDate] = useState(formatDate(today));

    // Determine if any form is active
    const isFormActive = currentView !== 'table';


    // --- Expense Fetching Logic (Unchanged) ---
    const fetchExpenses = async () => {
        const schoolCode = localStorage.getItem("schoolCode")?.trim().replace(/\s+/g, "_");
        if (schoolCode) {
            setDynamicSchoolCode(schoolCode);
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ fromDate, toDate });
                const response = await axios.get(`https://cleezoclass.com:4000/Accountentdataget?schoolCode=${schoolCode}&${params.toString()}`);
                setExpensesData(response.data);
            } catch (error) {
  console.error("❌ Error fetching expenses data:", error);
  setPopup({
    message: "❌ Failed to fetch expenses!",
    type: "error"
  });
}
 finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if (fromDate && toDate && currentView === 'table') { 
            fetchExpenses();
        } else if (currentView === 'table') {
            setExpensesData([]);
        }
    }, [fromDate, toDate, currentView]);
    
    useEffect(() => {
        const schoolCode = localStorage.getItem("schoolCode")?.trim().replace(/\s+/g, "_");
        if (schoolCode) {
            setDynamicSchoolCode(schoolCode);
        }
    }, []);
const getSchoolCode = () => {
    return localStorage.getItem('schoolCode');
};

    // --- New Form Handlers for Inline Flow ---
    const handleAddExpenseSubmit = (data) => {
        setExpenseFormData(data);
        setCurrentView('step2'); // Go to Step 2
    };

    const handleBackFromCreate = () => {
        setCurrentView('step1'); // Go back to Step 1
    };
    
    const handleCancelOrComplete = () => {
        setCurrentView('table'); // Go back to table view
        setExpenseFormData(null);
        fetchExpenses(); // Refresh data after completion/cancellation to show new expense
    };
// ================================================
    const [totals, setTotals] = useState({
        totalPaid: 0,
        totalBalance: 0,
        totalPrice: 0, // This is the value for "Total Expenses (Price)"
        loading: true,
        error: null
    });

    // *** SALARY TOTALS STATE ***
    const [salaryTotals, setSalaryTotals] = useState({
        totalPaidSalary: 0,
        loading: true,
        error: null
    });



        // Helper for displaying currency
    const formatCurrency = (amount, isSalary = false, isUtility = false) => {
        let state;
        if (isSalary) {
            state = salaryTotals;
        } else if (isUtility) {
            state = utilitiesTotals;
        } else {
            state = totals;
        }

        if (state.loading) return 'Loading...';
        if (state.error) return `Error: ${state.error}`;

        // Ensure amount is a number before formatting
        const numericAmount = parseFloat(amount) || 0;
        return numericAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    };
  const fetchTotals = async () => {
        setTotals(prev => ({ ...prev, loading: true, error: null }));
        const schoolCodeToUse = getSchoolCode();

        if (!schoolCodeToUse) {
            setTotals(prev => ({
                ...prev,
                loading: false,
                error: "School Code not found in LocalStorage"
            }));
            console.error("fetchTotals failed: schoolCode is null.");
            return;
        }

        try {
            // NOTE: Using a placeholder API endpoint as the original only fetched 'totals'
            const response = await axios.get(`https://cleezoclass.com:4000/api/totals?schoolCode=${schoolCodeToUse}`);

            const data = response.data;
            setTotals({
                totalPaid: parseFloat(data.totals.paid) || 0,
                totalBalance: parseFloat(data.totals.balance) || 0,
                totalPrice: parseFloat(data.totals.price) || 0,
                loading: false,
                error: null
            });
        } catch (err) {
  console.error("Error fetching Expense Totals:", err);
  setPopup({
    message: "❌ Failed to load expense totals!",
    type: "error"
  });
  setTotals(prev => ({
    ...prev,
    loading: false,
    error: err.message.includes('Network') ? 'Network Error' : 'API Error'
  }));
}

    };
     useEffect(() => {
            fetchTotals();
        }, []);
    const [popup, setPopup] = useState({ message: "", type: "" });

    // --- Styles (Mostly Unchanged) ---
    const primaryColor = '#007bff';
    const secondaryColor = '#dc3545';
    const lightGray = '#f8f9fa';
    const borderColor = '#ced4da';

    const styles = {
        outerContainer: { position: 'fixed', top: '50%',padding:'10px', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', height: '90vh', backgroundColor: '#fff', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)', borderRadius: '16px', overflow: 'hidden', fontFamily: 'Arial, sans-serif',},
        innerContent: { padding: '20px', height: '100%', overflowY: 'auto', border:'1px solid #ccc' , borderRadius:'16px' },
        header: { textAlign: 'center', marginBottom: '30px' },
        h1: { fontSize: '24px', color: '#333', margin: '0' },
        schoolName: { fontSize: '14px', color: '#666', marginTop: '5px' },
        summaryRow: { display: 'flex', gap: '15px', marginBottom: '30px' },
summaryCard: {
  flex: '1',
  backgroundColor: 'white',
  padding: '10px',
  borderRadius: '6px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  height: '15vh',
  position: 'relative',
  border: `1px solid ${borderColor}`,
  display: 'flex',
  flexDirection: 'column',
},
bottomRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "auto",
  paddingBottom: "0px", // 10px gap from bottom border
},

cardTitle: { fontSize: '12px', color: '#000', marginBottom: '3px', textAlign: 'left' },
        amount: { fontSize: '22px', fontWeight: 'bold', color: '#000', textAlign: 'left', justifyContent: 'flex-end', marginBottom:"0px" },
percentageLabel: {
  fontSize: '12px',
  color: '#000',
  padding: '2px 6px',
  borderRadius: '4px',
  marginLeft: "10px"
},
        middleSection: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
        subscriptionsBlock: { flex: '1', backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: `1px solid ${borderColor}` },
        blockTitle: { fontSize: '16px', marginBottom: '10px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px' },
        newExpenseBlock: { flex: '1.2', backgroundColor: 'white', padding: '5px', borderRadius: '6px',    overflowY: 'auto' ,    marginTop:'-2%',paddingTop:'0'

 },
        // Updated gap to accommodate two buttons
        actionButtons: { display: 'flex', gap: '8px', marginBottom: '15px', marginTop: '20px' },
        button: { padding: '8px 12px', border: 'none', borderRadius: '3px', cursor: 'pointer', width:'150px',fontWeight: 'bold', fontSize: '12px', flex: '1', transition: 'background-color 0.2s ease' },
        addButton: { backgroundColor: '#28a745', color: 'white' },
        createButton: { backgroundColor: '#5a7488', color: 'white' },
        expenseTable: { marginBottom: '15px', border: `1px solid ${borderColor}`, borderRadius: '4px', overflow: 'hidden' },
       expenseTableHeader: {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
  padding: '8px 10px',
  fontWeight: 'bold',
  backgroundColor: lightGray,
  fontSize: '10px',
  borderBottom: `1px solid ${borderColor}`,
  textTransform: 'uppercase',
  gap: '0',  // no gap so borders connect cleanly
},
cell: {
  borderRight: `1px solid ${borderColor}`,
  paddingRight: "8px"
}
,
expenseTableRow: {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
  padding: '8px 10px',
  borderBottom: `1px solid ${borderColor}`,
  fontSize: '12px',
  gap: '0',  // no gap
  alignItems: 'center'
},
emptyTableMessage: { textAlign: 'center', padding: '20px', color: '#6c757d', fontSize: '14px' },
        dateFilter: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', padding: '8px', border: `1px solid ${borderColor}`, borderRadius: '6px', backgroundColor: lightGray, transition: 'opacity 0.3s' },
        dateInput: { border: 'none', outline: 'none', fontSize: '12px', padding: '5px 8px', borderRadius: '3px', color: '#495057' }
    };
  const formatDate1 = (isoDate) => {
    const d = new Date(isoDate);
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
  };

  // Filter expenses based on provided props or display all if no props are passed
  const filteredExpenses = expensesData?.filter(expense => {
    let categoryMatch = true;
    let typeMatch = true;

    // Filter by expenseCategory if provided (i.e., not null, undefined, or empty string)
    if (expenseCategory) {
      categoryMatch = expense.type === expenseCategory;
    }

    // Filter by expenseType (specific name) if provided
    if (expenseType) {
      typeMatch = expense.name === expenseType;
    }

    return categoryMatch && typeMatch;
  });

  // Group *filtered* expenses by type for the card display
  const groupedExpenses = (filteredExpenses || []).reduce((acc, expense) => {
    // Grouping by expense.type (Expense Type)
    if (!acc[expense.type]) acc[expense.type] = [];
    acc[expense.type].push(expense);
    return acc;
  }, {});
const totalPaid = expensesData.reduce((sum, exp) => sum + Number(exp.paidAmount || 0), 0);
const totalBalance = expensesData.reduce((sum, exp) => sum + Number(exp.balance || 0), 0);


    return (
        <div style={styles.outerContainer}>
            <div style={styles.innerContent}>
             

                {/* Top Summary / Budget Row (Static) */}
           <section style={styles.summaryRow}>
  
  <div style={styles.summaryCard}>
    <h3 style={styles.cardTitle}>TOTAL BUDGET</h3>

    <div style={styles.bottomRow}>
      <p style={styles.amount}>₹XX,XXX.00</p>
      <span style={styles.percentageLabel}>30%</span>
    </div>
  </div>

  <div style={styles.summaryCard}>
    <h3 style={styles.cardTitle}>TOTAL EXPENSE</h3>

    <div style={styles.bottomRow}>
      <p style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#000" }}>
        {formatCurrency(totals.totalPrice)}
      </p>
      <span style={styles.percentageLabel}>20% of total</span>
    </div>
  </div>

  <div style={styles.summaryCard}>
    <h3 style={styles.cardTitle}>TOTAL MISCELLANEOUS</h3>

    <div style={styles.bottomRow}>
      <p style={styles.amount}>₹XX,XXX.00</p>
      <span style={styles.percentageLabel}>10%</span>
    </div>
  </div>

</section>

                {/* --- Middle Section: Subscriptions and Expense Entry --- */}
                <section style={styles.middleSection}>
                    
                    {/* Subscriptions Block (Left) - Structure kept, data static */}
<div style={{ 
  display: 'flex', 
  gap: '20px', 
  alignItems: 'stretch', 
  height: '58vh' // Set the max height you want for the container
}}>
  {/* Left: Expense Cards */}
  <div style={{ 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: "20px", 
    border: "1px solid #ccc", 
    display: 'flex', 
    flexDirection: 'column',
    overflowY: 'auto' ,
    borderRadius:'16px'
  }}>
    {Object.keys(groupedExpenses).length === 0 ? (
      <div style={{ textAlign: 'center', color: '#6c757d', padding: '50px' }}>
        No expenses found for the current selection (Check if the date range or filters are too restrictive).
      </div>
    ) : (
      Object.keys(groupedExpenses).map((type, typeIndex) => (
        <div key={typeIndex} style={{ marginBottom: "30px" }}>
          <div style={{ marginBottom: "15px", textAlign: "left" }}>
            <span style={{ fontSize: "38px", fontWeight: "600", marginRight: "10px" }}>
              {groupedExpenses[type].length}
            </span>
            <span style={{ fontSize: "16px", fontWeight: "500", color: "#555" }}>
              {type}
            </span>
          </div>

      <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
  {groupedExpenses[type].map((expense, index) => (
    <div
      key={index}
      style={{
        flex: "1 1 22%", 
        background: "#fff",
        borderRadius: "10px",
        padding: "15px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        marginBottom: "15px",
        border: '1px solid #ccc'
      }}
    >
      <div style={{ fontSize: "10px", fontWeight: "100", marginBottom: "5px", color:'#000' }}>
        {expense.name}
      </div>
      <div style={{ fontSize: "8px", color: "#555", marginBottom: "8px" }}>
        {expense.description}
      </div>
      <div style={{ fontSize: "13px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
        ₹ {expense.price?.toLocaleString('en-IN') || "0.00"}
      </div>
      <div style={{ fontSize: "10px", color: "#777" }}>
        {formatDate1(expense.date)}
      </div>
    </div>
  ))}
</div>

        </div>
      ))
    )}
  </div>

  {/* Right: Action Buttons + Table/Form */}
  <div style={{ 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: "10px", 
    border: "1px solid #ccc", 
    display: 'flex', 
    flexDirection: 'column',
    borderRadius:'16px',
  }}>
    <div style={styles.newExpenseBlock}>
      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        {currentView === 'table' ? (
          <>
            <button 
              style={{...styles.button, ...styles.createButton}}
              onClick={() => setCurrentView('step1')} // Used for transaction entry
            >
              Add Expense (Transaction)
            </button>
            <button 
              style={{...styles.button, ...styles.addButton, backgroundColor: '#5a7488'}}
              onClick={() => setCurrentView('create_master')} // NEW: For master data creation
            >
              Create Expense (Master) 
            </button>
          </>
        ) : (
           <button 
   className="btn-solid"
      onClick={handleCancelOrComplete}
    >
      CANCEL
    </button>
        )}
      </div>


      {/* Form or Table */}
      {currentView === 'step1' && (
  <AddExpenseForm 
    onSubmit={handleAddExpenseSubmit} 
    onCancel={handleCancelOrComplete}
    setPopup={setPopup}
  />      )}

      {/* NEW: Render the master expense form */}
      {currentView === 'create_master' && (
        <CreateMasterExpenseForm />
      )}
      
      {/* Date Filter */}
    {/* Date Filter - show ONLY in table view */}
{currentView === 'table' && (
  <div style={styles.dateFilter}>
    <label style={{ fontWeight: 600, color: '#495057', fontSize: '12px' }}>From:</label>
    <input 
      type="date" 
      value={fromDate} 
      onChange={(e) => setFromDate(e.target.value)} 
      style={styles.dateInput}
    />

    <label style={{ fontWeight: 600, color: '#495057', fontSize: '12px' }}>To:</label>
    <input 
      type="date" 
      value={toDate} 
      onChange={(e) => setToDate(e.target.value)} 
      style={styles.dateInput}
    />
  </div>
)}

      {currentView === 'step2' && (
   <ExpenseForm 
  initialData={expenseFormData} 
  onClose={handleCancelOrComplete} 
  onExpenseCreated={handleCancelOrComplete} 
  onBack={handleBackFromCreate}
  setPopup={setPopup}
/>

      )}
      {currentView === 'table' && (
        <div style={styles.expenseTable}>
          <div style={styles.expenseTableHeader}>
            <span>DATE</span>
              <span>NAME</span>
            <span>paid amount</span>
            <span>Balance Amount</span>
            <span>MODE</span>
          </div>
          {isLoading ? (
            <div style={styles.emptyTableMessage}>Loading expenses...</div>
          ) : expensesData.length === 0 ? (
            <div style={styles.emptyTableMessage}>No expenses found for the selected dates.</div>
          ) : (
          expensesData.map((expense, index) => (
  <div key={index} style={styles.expenseTableRow}>
    
    <span style={styles.cell}>{
      expense.date ? new Date(expense.date).toLocaleDateString("en-IN") : "N/A"
    }</span>

    <span style={styles.cell}>{expense.description || "N/A"}</span>
    <span style={styles.cell}>₹{expense.price?.toLocaleString("en-IN") || "0.00"}</span>
    <span style={styles.cell}>₹{expense.balance?.toLocaleString("en-IN") || "0.00"}</span>

    <span>{expense.paymentMode || "N/A"}</span> {/* last one has no border */}
    
  </div>
  
))

          )}
{/* ===================== TOTAL ROW ===================== */}
<div style={{ 
  ...styles.expenseTableRow, 
  fontWeight: "bold", 
  backgroundColor: "#f1f1f1" 
}}>
  <span>Total</span>
  <span></span>               {/* NAME EMPTY */}
  
  {/* Total Paid under PAID column */}
  <span style={styles.cell}>
    ₹{totalPaid.toLocaleString("en-IN")}
  </span>

  {/* Total Balance under BALANCE column */}
  <span style={styles.cell}>
    ₹{totalBalance.toLocaleString("en-IN")}
  </span>

  <span></span>               {/* MODE EMPTY */}
</div>
        </div>
        
      )}
    </div>
  </div>
</div>


                </section>
            </div>
<ErrorPopup
  message={popup.message}
  type={popup.type}
  onClose={() => setPopup({ message: "", type: "" })}
/>



        </div>
    );
};

export default ExpenseTrackerUI;