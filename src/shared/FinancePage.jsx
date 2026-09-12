import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';

// ====================================================================
// ExpenseForm Component (Create Form) - FINAL
// ====================================================================
const ExpenseForm = ({ initialData, onClose, onExpenseCreated, onBack }) => {
    // CORRECTED: Renamed state variables for clarity and correctness
    const [expenseCategory, setExpenseCategory] = useState(''); // e.g., "Maintenance"
    const [specificExpenseName, setSpecificExpenseName] = useState(''); // e.g., "Building Repair"
   
    const [description, setDescription] = useState('');
    const [paymentMode, setPaymentMode] = useState('BANK');
    const [totalAmount, setTotalAmount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [balance, setBalance] = useState('');
    const [personName, setPersonName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        if (initialData) {
            // Populating the clear, new state variables
            setExpenseCategory(initialData.expenseCategory || '');
            setSpecificExpenseName(initialData.specificExpenseName || '');
            setDescription(initialData.description || '');
            setPersonName(initialData.name || ''); // maps from `name` in previous form
            setMobileNumber(initialData.mobileNumber || '');
            setPrice(initialData.price || '');
        }
    }, [initialData]);

    // This bug fix for the balance calculation is correct and remains.
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

    // FINAL FIX: This now sends the correct data to the correct API fields.
    const handleSubmit = async (event) => {
        event.preventDefault();
        const schoolCode = localStorage.getItem('schoolCode');

        const expenseData = {
            expenseName: specificExpenseName, // The long name goes to the 'expenseName' field
            expenseType: expenseCategory,     // The short category goes to the 'expenseType' field
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
            const response = await axios.post('https://cleezoclass.com:4000/Accountntdata', expenseData);
            console.log('Expense saved successfully:', response.data);
            alert('✅ Expense created successfully!');
            onExpenseCreated();
            onClose();
        } catch (error) {
            console.error('❌ Error submitting expense:', error);
            alert('❌ Failed to create expense. Check console for details.');
        }
    };
   
    const styles = { /* Styles remain unchanged */
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 },
        formContainer: { width: '650px', padding: '25px 30px', borderRadius: '8px', fontFamily: 'sans-serif', position: 'relative', backgroundColor: '#fff', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)', maxHeight: '90vh', overflowY: 'auto' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
        headerLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
        backButton: { cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', padding: 0 },
        title: { fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#333' },
        cancelIcon: { cursor: 'pointer', fontSize: '24px', color: '#888' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#555' },
        input: { width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' },
        textarea: { width: '100%', padding: '12px', boxSizing: 'border-box', minHeight: '80px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' },
        select: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: '#fff' },
        button: { width: '100%', backgroundColor: '#28a745', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.formContainer} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <button onClick={onBack} style={styles.backButton}><ArrowLeft size={24} color="#333" /></button>
                        <h2 style={styles.title}>Create Expense</h2>
                    </div>
                    <div style={styles.cancelIcon} onClick={onClose}>×</div>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* CORRECTED: The UI now correctly displays the right data in the right field */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Expense Type</label>
                        <input type="text" value={expenseCategory} style={{ ...styles.input, backgroundColor: '#e9ecef' }} readOnly />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Expense Name</label>
                        <input type="text" value={specificExpenseName} style={{ ...styles.input, backgroundColor: '#e9ecef' }} required readOnly />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea value={description} style={{ ...styles.textarea, backgroundColor: '#e9ecef' }} required readOnly />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Payment Mode</label>
                        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={styles.select}>
                            <option value="BANK">BANK</option><option value="CASH">CASH</option><option value="UPI">UPI</option><option value="CHECK">CHECK</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Total Amount</label>
                        <input type="number" value={totalAmount} max="999999" onChange={(e) => setTotalAmount(e.target.value)} style={styles.input} required />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Paid</label>
                        <input type="number" value={paidAmount} max="999999" onChange={(e) => setPaidAmount(e.target.value)} style={styles.input} required />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Balance</label>
                        <input type="text" value={balance} style={{ ...styles.input, backgroundColor: '#e9ecef', color: '#6c757d' }} readOnly />
                    </div>
                    <button type="submit" style={styles.button}>Submit Expense</button>
                </form>
            </div>
        </div>
    );
};

// ====================================================================
// AddExpenseForm Component - FINAL
// ====================================================================
const AddExpenseForm = ({ onClose, onSubmit }) => {
    // CORRECTED: State variables have been renamed for clarity and to fix the bug.
    const [expenseCategory, setExpenseCategory] = useState('Maintenance'); // e.g., "Maintenance"
    const [specificExpenseName, setSpecificExpenseName] = useState(''); // e.g., "Building Repair"

    const [mobileNumber, setMobileNumber] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');

    // FINAL FIX: This now passes a clean, logical data object to the parent.
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            expenseCategory: expenseCategory,
            specificExpenseName: specificExpenseName,
            description,
            mobileNumber,
            name,
            price
        });
        onClose();
    };

    const styles = { /* Styles remain unchanged */
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        formContainer: { backgroundColor: '#fff', padding: '25px 30px', borderRadius: '8px', width: '650px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)', maxHeight: '90vh', overflowY: 'auto' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
        title: { fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#333' },
        cancelIcon: { fontSize: '24px', cursor: 'pointer' },
        formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' },
        formGroup: { marginBottom: '20px' },
        fullWidth: { gridColumn: '1 / -1' },
        label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#555' },
        input: { width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' },
        textarea: { width: '100%', padding: '12px', boxSizing: 'border-box', minHeight: '80px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', resize: 'vertical' },
        submitButton: { width: '100%', padding: '12px', backgroundColor: '#5a7488', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }
    };
const expenseOptions = {
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
    "IT support & Maintenance (Hardware/Software)",
    "Digital Learning tools (Byju's, Google Classrooms)",
    "Website Maintenance & Hosting Services",
    "Smart Class setup and AMC (Annual Maintenance Contract)"
  ],
  "Transport-related Services": [
    "Vehicle Maintenance & Repair",
    "Fuel & Oil Services",
    "GPS Tracking System Services",
    "Transport Contract Services (if outsourced)"
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
    "Health Insurance (if provided to Staff)",
    "Sanitization and Hygiene Services"
  ]
};

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.formContainer} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Add Expenses Details</h2>
                    <span style={styles.cancelIcon} onClick={onClose}>×</span>
                </div>
             <form onSubmit={handleSubmit}>
      <div style={styles.formGrid}>
        {/* Expense Type */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Expense Type</label>
          <select
            value={expenseCategory}
            onChange={(e) => {
              setExpenseCategory(e.target.value);
              setSpecificExpenseName(""); // Reset dependent dropdown
            }}
            style={styles.input}
            required
          >
            <option value="" disabled>-- Select Expense Type --</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Depreciation">Depreciation</option>
            <option value="Maintenance Services">Maintenance Services</option>
            <option value="Digital & IT Services">Digital & IT Services</option>
            <option value="Transport-related Services">Transport-related Services</option>
            <option value="Administrative Financial Services">Administrative Financial Services</option>
            <option value="Health & Safety Services">Health & Safety Services</option>
          </select>
        </div>

        {/* Expense Name (Dependent Dropdown) */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Expense Name</label>
          <select
            value={specificExpenseName}
            onChange={(e) => setSpecificExpenseName(e.target.value)}
            style={styles.input}
            required
            disabled={!expenseCategory || !expenseOptions[expenseCategory]}
          >
            <option value="" disabled>-- Select an option --</option>
            {expenseCategory && expenseOptions[expenseCategory]?.map((name) => (
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
            style={styles.input}
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
            style={styles.input}
          />
        </div>

        {/* Description */}
        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
          <label style={styles.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength="250"
            style={styles.textarea}
            required
          />
        </div>

        {/* Price */}
        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
          <label style={styles.label}>Price (Optional)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            max="999999"
            style={styles.input}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button type="submit" style={styles.submitButton}>Submit</button>
    </form>
            </div>
        </div>
    );
};


// ====================================================================
// FinancePage Component (Main Component) - FINAL
// ====================================================================
const FinancePage = () => {
    // This component's logic is now clean and correct.
    const [expensesData, setExpensesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
    const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
    const [isAddExpenseFormOpen, setIsAddExpenseFormOpen] = useState(false);
    const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
    const [expenseFormData, setExpenseFormData] = useState(null);
   
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const [fromDate, setFromDate] = useState(formatDate(oneMonthAgo));
    const [toDate, setToDate] = useState(formatDate(today));

    const fetchExpenses = async () => { /* This function remains unchanged */
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
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => { /* This hook remains unchanged */
        if (fromDate && toDate) fetchExpenses();
        else setExpensesData([]);
    }, [fromDate, toDate]);

    useEffect(() => { /* This hook remains unchanged */
        const schoolCode = localStorage.getItem("schoolCode")?.trim().replace(/\s+/g, "_");
        if (schoolCode) {
            setDynamicSchoolCode(schoolCode);
            axios.post('https://cleezoclass.com:4000/api/schoollogodynamic', { secretecode: schoolCode })
                .then(res => res.data.logoPath && setDynamicLogoSrc(res.data.logoPath))
                .catch(err => console.error('Error fetching school logo:', err));
        }
    }, []);

    // This handler now receives a clean data object and works correctly.
    const handleAddExpenseSubmit = (data) => {
        setExpenseFormData(data);
        setIsAddExpenseFormOpen(false);
        setIsExpenseFormOpen(true);
    };

    const handleBackFromCreate = () => {
        setIsExpenseFormOpen(false);
        setIsAddExpenseFormOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc' }}>
             <style>{`
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
                .main-content { flex-grow: 1; padding: 24px 40px; overflow-y: auto; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .header h1 { font-size: 28px; font-weight: 700; margin: 0; }
                .action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px; }
                .filter-bar { display: flex; align-items: center; margin-bottom: 20px; gap: 10px; }
                .action-bar button { padding: 10px 18px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color 0.2s ease; }
                .action-bar .secondary-btn { background-color: #f1f3f5; color: #495057; border: 1px solid #ced4da; }
                .action-bar .secondary-btn:hover { background-color: #e9ecef; }
                .table-container { background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); padding: 20px; overflow-x: auto; }
                .expenses-table { width: 100%; border-collapse: collapse; }
                .expenses-table th, .expenses-table td { padding: 15px; text-align: left; font-size: 14px; }
                .expenses-table thead { border-bottom: 2px solid #e9ecef; }
                .expenses-table th { color: #6c757d; font-weight: 600; text-transform: uppercase; }
                .empty-table-message { text-align: center; padding: 40px; color: #6c757d; }
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
           
            {isAddExpenseFormOpen && <AddExpenseForm onClose={() => setIsAddExpenseFormOpen(false)} onSubmit={handleAddExpenseSubmit} />}
            {isExpenseFormOpen && <ExpenseForm initialData={expenseFormData} onClose={() => setIsExpenseFormOpen(false)} onExpenseCreated={fetchExpenses} onBack={handleBackFromCreate} />}

            <header style={{ backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', position: 'sticky', top: 0, zIndex: 50, height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
                <img src={dynamicLogoSrc || "/default-logo.png"} alt="School Logo" style={{ height: '80px', width: 'auto' }} />
                <h1 style={{ color: 'black', fontSize: '1.5rem', fontWeight: '600', textTransform: 'uppercase' }}>{dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL</h1>
                <span style={{ color: 'black', fontWeight: '600' }}>ACCOUNTANT</span>
            </header>
           
            <div style={{ display: "flex", flex: 1, overflow: 'hidden' }}>
                <main className="main-content">
                    <header className="header"><h1>Accountant</h1></header>
                    <div className="action-bar">
                        <button className="secondary-btn" onClick={() => setIsAddExpenseFormOpen(true)}>Add Expenses</button>
                    </div>
                    <div className="filter-bar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ced4da', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fff' }}>
                            <label htmlFor="from-date" style={{ fontWeight: 600, color: '#495057' }}>From:</label>
                            <input type="date" id="from-date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '14px', color: '#495057', cursor: 'pointer' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ced4da', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fff' }}>
                            <label htmlFor="to-date" style={{ fontWeight: 600, color: '#495057' }}>To:</label>
                            <input type="date" id="to-date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '14px', color: '#495057', cursor: 'pointer' }} />
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="expenses-table">
                            <thead><tr><th>No.</th><th>Date</th><th>Expenses Type</th><th>Expenses Name</th><th>Description</th><th>Payment Mode</th></tr></thead>
                            {/* // ✅ CORRECTED CODE */}
<tbody>
    {isLoading ? (
        <tr><td colSpan="6" className="empty-table-message">select date...</td></tr>
    ) : expensesData.length === 0 ? (
        <tr><td colSpan="6"><div className="empty-table-message">No expenses found for the selected dates.</div></td></tr>
    ) : (
        expensesData.map((expense, index) => (
            <tr key={expense._id || index}>
                <td>{index + 1}</td>
                <td>{expense.date ? new Date(expense.date).toLocaleDateString("en-IN") : "N/A"}</td>
                <td>{expense.type || "N/A"}</td>
                <td>{expense.name || "N/A"}</td>
                <td>{expense.description || "N/A"}</td>
                <td>{expense.paymentMode || "N/A"}</td>
            </tr>
        ))
    )}
</tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FinancePage;