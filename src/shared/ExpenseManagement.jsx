import { CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useContext, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import axios from 'axios';

const ExpenseManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState("Selectoption");
  const [selectedDate, setSelectedDate] = useState("");

  // Data states
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [depreciationData, setDepreciationData] = useState(null);
  const [goodwillData, setGoodwillData] = useState(null);
  const [expensesData, setExpensesData] = useState({ expenses: [], total_expenses: 0 });
  const [feeData, setFeeData] = useState({ fees: [], total_fees: 0 });
  const [scannerData, setScannerData] = useState({ bills: [], total_bills: 0 });

  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const [bills, setBills] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch school logo and code on component mount
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) return;

      setDynamicSchoolCode(code);
      try {
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
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

  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode');
    fetch("https://cleezoclass.com:4000/getAllBills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolCode })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text() || "Failed to fetch bills");
        return res.json();
      })
      .then((data) => {
        setBills(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Get date range based on selected option
  const getDateRange = (option) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const endOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);
    lastWeekEnd.setDate(startOfWeek.getDate() - 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1);
    const lastQuarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 0);
    const lastHalfYearStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const lastHalfYearEnd = new Date(today);
    const lastFinancialYearStart = new Date(today.getFullYear() - 1, 3, 1);
    const lastFinancialYearEnd = new Date(today.getFullYear(), 2, 31);
    const formatDate = (date) => date.toISOString().split('T')[0];
    switch(option) {
      case 'today': return formatDate(today);
      case 'ThisWeek': return `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
      case 'lastWeek': return `${formatDate(lastWeekStart)} to ${formatDate(lastWeekEnd)}`;
      case 'lastMonth': return `${formatDate(lastMonthStart)} to ${formatDate(lastMonthEnd)}`;
      case 'lastQuarter': return `${formatDate(lastQuarterStart)} to ${formatDate(lastQuarterEnd)}`;
      case 'lastHalfYear': return `${formatDate(lastHalfYearStart)} to ${formatDate(lastHalfYearEnd)}`;
      case 'lastFinancialYear': return `${formatDate(lastFinancialYearStart)} to ${formatDate(lastFinancialYearEnd)}`;
      case 'thisMonth': return `${formatDate(startOfMonth)} to ${formatDate(endOfMonth)}`;
      case 'thisQuarter': return `${formatDate(startOfQuarter)} to ${formatDate(endOfQuarter)}`;
      case 'thisHalfyear': return `${formatDate(new Date(today.getFullYear(), today.getMonth() < 6 ? 0 : 6, 1))} to ${formatDate(new Date(today.getFullYear(), today.getMonth() < 6 ? 5 : 11, today.getMonth() < 6 ? 30 : 31))}`;
      case 'thisFinyear':
        const finYearStart = today.getMonth() >= 3 ?
          new Date(today.getFullYear(), 3, 1) :
          new Date(today.getFullYear() - 1, 3, 1);
        const finYearEnd = today.getMonth() >= 3 ?
          new Date(today.getFullYear() + 1, 2, 31) :
          new Date(today.getFullYear(), 2, 31);
        return `${formatDate(finYearStart)} to ${formatDate(finYearEnd)}`;
      case 'yesterday': return formatDate(yesterday);
      default: return "";
    }
  };

  // Update selected date when option changes
  useEffect(() => {
    if (selectedOption && selectedOption !== "Selectoption") {
      const dateRange = getDateRange(selectedOption);
      setSelectedDate(dateRange);
    }
  }, [selectedOption]);

  // Fetch data when tab changes and date is selected
  const handleTabChange = async (tab) => {
    if (!selectedDate) {
      alert("Please select a time period first");
      return;
    }
 if (tab === 'LEDGER') {
    navigate('/ServiceManagementdetails');
    return;
  }
    setActiveTab(tab);
    setLoading(true);
    setError(null);

    try {
      const schoolCode = localStorage.getItem("schoolCode");
      switch(tab) {
        case 'maintenance':
          await fetchMaintenanceData(selectedDate, schoolCode);
          break;
        case 'depreciation':
          await fetchDepreciationData(selectedDate, schoolCode);
          break;
        case 'goodwill':
          await fetchGoodwillData(selectedDate, schoolCode);
          break;
        case 'expenses':
          await fetchExpensesData(selectedDate, schoolCode);
          break;
        case 'fees':
          await fetchFeeData(selectedDate, schoolCode);
          break;
        case 'scanner':
          await fetchScannerData(selectedDate, schoolCode);
          break;
           case 'LEDGER':
          await fetchScannerData(selectedDate, schoolCode);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError("Error fetching data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Data fetching functions
  const fetchMaintenanceData = async (dateRange, schoolCode) => {
    let url = "https://cleezoclass.com:4000/api/totalcost";
    const params = new URLSearchParams();
    if (dateRange.includes(" to ")) {
      const [startDate, endDate] = dateRange.split(" to ");
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    } else {
      params.append("date", dateRange);
    }
    params.append("schoolCode", schoolCode);

    const response = await axios.get(`${url}?${params.toString()}`);
    const data = response.data;
    setMaintenanceData({
      electric_cost: data.electric_cost || 0,
      security_cost: data.security_cost || 0,
      it_cost: data.it_cost || 0,
      transport_cost: data.transport_cost || 0,
      furniture_cost: data.furniture_cost || 0,
      sports_cost: data.sports_cost || 0,
      total_cost: data.total_cost || 0
    });
  };

  const fetchDepreciationData = async (dateRange, schoolCode) => {
    let url = "https://cleezoclass.com:4000/api/totaldepreciation";
    const params = new URLSearchParams();
    if (dateRange.includes(" to ")) {
      const [startDate, endDate] = dateRange.split(" to ");
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    } else {
      params.append("date", dateRange);
    }
    params.append("schoolCode", schoolCode);

    const response = await axios.get(`${url}?${params.toString()}`);
    const data = response.data;
    setDepreciationData({
      total_depreciation: data.total_depreciation || 0
    });
  };

  const fetchGoodwillData = async (dateRange, schoolCode) => {
    let url = "https://cleezoclass.com:4000/expensesgoodwill";
    const params = new URLSearchParams();
    if (dateRange.includes(" to ")) {
      const [startDate, endDate] = dateRange.split(" to ");
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    } else {
      params.append("date", dateRange);
    }
    params.append("schoolCode", schoolCode);

    const response = await axios.get(`${url}?${params.toString()}`);
    const data = response.data;
    setGoodwillData({
      total_cost: data.total_cost || 0,
      breakdown: [
        data.total_cost * 0.2 || 0,
        data.total_cost * 0.3 || 0,
        data.total_cost * 0.25 || 0,
        data.total_cost * 0.25 || 0
      ]
    });
  };

  const fetchExpensesData = async (dateRange, schoolCode) => {
    let startDate;
    let endDate;

    if (dateRange.includes(" to ")) {
      [startDate, endDate] = dateRange.split(" to ");
    } else {
      startDate = dateRange;
      endDate = dateRange;
    }

    const isWithinRange = (value) => {
      if (!value) return false;
      const current = new Date(value);
      if (Number.isNaN(current.getTime())) return false;

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return current >= start && current <= end;
    };

    const [expensesResponse, billsResponse] = await Promise.all([
      axios.get(`https://cleezoclass.com:4000/totalexpensesData?schoolCode=${schoolCode}`),
      fetch("https://cleezoclass.com:4000/getAllBills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode })
      })
    ]);

    const rawExpenses = Array.isArray(expensesResponse.data) ? expensesResponse.data : [];
    const normalizedExpenses = rawExpenses
      .filter((item) => isWithinRange(item.expense_date || item.date))
      .map((item) => ({
        id: item.id || 0,
        type: item.expense_type || item.type || "N/A",
        amount: Number(item.price) || Number(item.amount) || 0,
        quantity: Number(item.quantity) || 1,
        total_cost: Number(item.price) || Number(item.total_cost) || Number(item.amount) || 0,
        vendor_name: item.vendor_name || item.name || "N/A",
        vendor_contact: item.vendor_contact || "N/A",
        payment_method: item.payment_mode || item.payment_method || "N/A",
        date: item.expense_date || item.date || new Date().toISOString(),
        description: item.description || "No description",
        imageUrl: item.imageUrl || "",
        isUploadedBill: false
      }));

    const rawBills = billsResponse.ok ? await billsResponse.json() : [];
    const normalizedBills = (Array.isArray(rawBills) ? rawBills : [])
      .filter((bill) => isWithinRange(bill.date))
      .map((bill) => ({
        id: bill.id || `bill_${Math.random()}`,
        type: bill.bill_type || "Uploaded Bill",
        amount: Number(bill.amount) || 0,
        quantity: 1,
        total_cost: Number(bill.amount) || 0,
        vendor_name: bill.vendor_name || "N/A",
        vendor_contact: "N/A",
        payment_method: "N/A",
        date: bill.date || new Date().toISOString(),
        description: bill.description || "Uploaded bill",
        imageUrl: bill.imageUrl || "",
        isUploadedBill: true
      }));

    const mergedExpenses = [...normalizedExpenses, ...normalizedBills].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    setExpensesData({
      expenses: mergedExpenses,
      total_expenses: mergedExpenses.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0)
    });
  };

  const fetchFeeData = async (dateRange, schoolCode) => {
    try {
      let startDate, endDate;
      if (dateRange.includes(" to ")) {
        [startDate, endDate] = dateRange.split(" to ");
      } else {
        startDate = dateRange;
        endDate = dateRange;
      }
      const url = `https://cleezoclass.com:4000/api/feeDataFinance?schoolCode=${schoolCode}`;
      const response = await axios.post(url, { startDate, endDate });
      const feesData = response.data;
      const fees = feesData.map(fee => ({
        id: fee.id || 0,
        student_name: fee.studentName || "N/A",
        class_name: fee.className || "N/A",
        section: fee.Section || "N/A",
        fee_type: "Complete Fee",
        amount: Number(fee.CompleteFee) || 0,
        paidAmount: Number(fee.Paid_Amount) || 0,
        discount: Number(fee.Discount) || 0,
        finalAmount: Number(fee.Final_Amount) || 0,
        date: fee.created_at || new Date().toISOString(),
        description: `Fee details for ${fee.studentName || "N/A"}`
      }));
      const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
      setFeeData({ fees, total_fees: totalFees });
    } catch (error) {
      console.error('Error fetching fee data:', error);
      setFeeData({ fees: [], total_fees: 0 });
    }
  };

  const fetchScannerData = async (dateRange, schoolCode) => {
    try {
      let startDate, endDate;
      if (dateRange.includes(" to ")) {
        [startDate, endDate] = dateRange.split(" to ");
      } else {
        startDate = dateRange;
        endDate = dateRange;
      }
      const url = `https://cleezoclass.com:4000/getAllBills`;
      const response = await axios.post(url, { schoolCode, startDate, endDate });
      const billsData = response.data;
      setScannerData({ bills: billsData, total_bills: billsData.length });
    } catch (error) {
      console.error('Error fetching scanner data:', error);
      setScannerData({ bills: [], total_bills: 0 });
    }
  };

  // Format data for display
  const formatMaintenanceData = () => {
    if (!maintenanceData) return [];
    return [{
      id: 1,
      department: "All",
      maintenance_type: "Total",
      electric_cost: maintenanceData.electric_cost,
      security_cost: maintenanceData.security_cost,
      it_cost: maintenanceData.it_cost,
      transport_cost: maintenanceData.transport_cost,
      furniture_cost: maintenanceData.furniture_cost,
      sports_cost: maintenanceData.sports_cost,
      total_cost: maintenanceData.total_cost,
      status: "Completed",
      maintenance_date: new Date().toISOString()
    }];
  };

  const formatDepreciationData = () => {
    if (!depreciationData) return [];
    return [{
      id: 1,
      assetCode: "DEP-001",
      assetName: "Total Depreciation",
      category: "Financial",
      assetType: "Depreciation",
      assetCondition: "N/A",
      purchaseCost: 0,
      currentValue: 0,
      location: "N/A",
      assignedTo: "N/A",
      lastMaintenanceDate: null,
      nextMaintenanceDue: null,
      total_depreciation: depreciationData.total_depreciation
    }];
  };

  const formatGoodwillData = () => {
    if (!goodwillData) return [];
    return [{
      id: 1,
      type: "Total Goodwill",
      vendor_name: "Multiple",
      vendor_contact: "N/A",
      amount: 0,
      quantity: 0,
      total_cost: goodwillData.total_cost,
      payment_method: "Multiple",
      date: new Date().toISOString(),
      description: "Aggregated goodwill expenses"
    }];
  };

  const formatExpensesData = () => {
    if (!expensesData || !expensesData.expenses || expensesData.expenses.length === 0) return [];
    return expensesData.expenses;
  };

  const formatScannerData = () => {
    if (!scannerData || !scannerData.bills || scannerData.bills.length === 0) return [];
    return scannerData.bills;
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const renderTabContent = () => {
    if (!activeTab) return null;

    if (loading) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            marginBottom: '20px',
            color: '#555'
          }}>
            Loading data...
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          color: '#d32f2f',
          textAlign: 'center',
          padding: '20px',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {error}
        </div>
      );
    }

    switch (activeTab) {
      case 'maintenance':
        return (
          <div style={{
            overflowX: 'auto',
            marginTop: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#333',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Maintenance Data for {selectedDate}
            </h4>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px',
                minWidth: '800px'
              }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Department</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Electric Cost</th>
                    <th style={styles.tableHeader}>Security Cost</th>
                    <th style={styles.tableHeader}>IT Cost</th>
                    <th style={styles.tableHeader}>Transport Cost</th>
                    <th style={styles.tableHeader}>Furniture Cost</th>
                    <th style={styles.tableHeader}>Sports Cost</th>
                    <th style={styles.tableHeader}>Total Cost</th>
                    <th style={styles.tableHeader}>Status</th>
                    <th style={styles.tableHeader}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {formatMaintenanceData().map((data, index) => (
                    <tr key={index}>
                      <td style={styles.tableCell}>{data.department}</td>
                      <td style={styles.tableCell}>{data.maintenance_type}</td>
                      <td style={styles.tableCell}>₹{data.electric_cost?.toFixed(2)}</td>
                      <td style={styles.tableCell}>₹{data.security_cost?.toFixed(2)}</td>
                      <td style={styles.tableCell}>₹{data.it_cost?.toFixed(2)}</td>
                      <td style={styles.tableCell}>₹{data.transport_cost?.toFixed(2)}</td>
                      <td style={styles.tableCell}>₹{data.furniture_cost?.toFixed(2)}</td>
                      <td style={styles.tableCell}>₹{data.sports_cost?.toFixed(2)}</td>
                      <td style={styles.tableCell}>₹{data.total_cost?.toFixed(2)}</td>
                      <td style={styles.tableCell}>{data.status}</td>
                      <td style={styles.tableCell}>{new Date(data.maintenance_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'depreciation':
        return (
          <div style={{
            overflowX: 'auto',
            marginTop: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#333',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Depreciation Data for {selectedDate}
            </h4>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px',
                minWidth: '600px'
              }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Asset Code</th>
                    <th style={styles.tableHeader}>Name</th>
                    <th style={styles.tableHeader}>Category</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Condition</th>
                    <th style={styles.tableHeader}>Total Depreciation</th>
                  </tr>
                </thead>
                <tbody>
                  {formatDepreciationData().map((data, index) => (
                    <tr key={index}>
                      <td style={styles.tableCell}>{data.assetCode}</td>
                      <td style={styles.tableCell}>{data.assetName}</td>
                      <td style={styles.tableCell}>{data.category}</td>
                      <td style={styles.tableCell}>{data.assetType}</td>
                      <td style={styles.tableCell}>{data.assetCondition}</td>
                      <td style={styles.tableCell}>₹{data.total_depreciation?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'goodwill':
        return (
          <div style={{
            overflowX: 'auto',
            marginTop: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#333',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Goodwill Data for {selectedDate}
            </h4>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px',
                minWidth: '400px'
              }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Vendor</th>
                    <th style={styles.tableHeader}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {formatGoodwillData().map((data, index) => (
                    <tr key={index}>
                      <td style={styles.tableCell}>{data.type}</td>
                      <td style={styles.tableCell}>{data.vendor_name}</td>
                      <td style={styles.tableCell}>₹{data.total_cost?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'expenses':
        return (
          <div style={{
            overflowX: 'auto',
            marginTop: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#333',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Expenses Data for {selectedDate}
            </h4>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px',
                minWidth: '900px'
              }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Vendor</th>
                    <th style={styles.tableHeader}>Amount</th>
                    <th style={styles.tableHeader}>Quantity</th>
                    <th style={styles.tableHeader}>Total Cost</th>
                    <th style={styles.tableHeader}>Payment Method</th>
                    <th style={styles.tableHeader}>Date</th>
                    <th style={styles.tableHeader}>Description</th>
                    <th style={styles.tableHeader}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formatExpensesData().map((data, index) => (
                    <tr key={index}>
                      <td style={styles.tableCell}>{data.type}</td>
                      <td style={styles.tableCell}>{data.vendor_name}</td>
                      <td style={styles.tableCell}>₹{data.amount?.toFixed(2)}</td>
                      <td style={styles.tableCell}>{data.quantity}</td>
                      <td style={styles.tableCell}>₹{data.total_cost?.toFixed(2)}</td>
                      <td style={styles.tableCell}>{data.payment_method}</td>
                      <td style={styles.tableCell}>{data.date ? new Date(data.date).toLocaleDateString() : 'N/A'}</td>
                      <td style={styles.tableCell}>
                        {data.description}
                        {data.isUploadedBill ? " (Uploaded Bill)" : ""}
                      </td>
                      <td style={styles.tableCell}>
                        {data.imageUrl ? (
                          <button
                            onClick={() => openImageModal(data.imageUrl)}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #5a7488',
                              color: '#5a7488',
                              fontWeight: '500',
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '4px'
                            }}
                          >
                            View
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'scanner':
        return (
          <div style={{
            overflowX: 'auto',
            marginTop: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#333',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Bill Scanner Data for {selectedDate}
            </h4>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px',
                minWidth: '600px'
              }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Amount</th>
                    <th style={styles.tableHeader}>Date</th>
                    <th style={styles.tableHeader}>Description</th>
                    <th style={styles.tableHeader}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formatScannerData().map((bill, index) => (
                    <tr key={index}>
                      <td style={styles.tableCell}>{bill.bill_type || "Bill"}</td>
                      <td style={styles.tableCell}>₹{bill.amount || "N/A"}</td>
                      <td style={styles.tableCell}>{bill.date ? new Date(bill.date).toLocaleDateString() : "Unknown"}</td>
                      <td style={styles.tableCell}>{bill.description || "-"}</td>
                      <td style={styles.tableCell}>
                        {bill.imageUrl && (
                          <button
                            onClick={() => openImageModal(bill.imageUrl)}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #5a7488',
                              color: '#5a7488',
                              fontWeight: '500',
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease',
                              ':hover': {
                                backgroundColor: '#eff6ff',
                                color: '#5a7488'
                              }
                            }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      <header style={{
        backgroundColor: '#fff',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: '0',
        zIndex: '50',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem'
      }}>
        <img
          src={dynamicLogoSrc || "/default-logo.png"}
          alt="School Logo"
          style={{
            height: '60px',
            width: 'auto',
            borderRadius: '4px',
            position: 'absolute',
            left: '2rem',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
        <div style={{
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          flex: 1
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0,
            whiteSpace: 'nowrap',
            color: 'black'
          }}>
            {dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL
          </h1>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          position: 'absolute',
          right: '2rem'
        }}>
         
        </div>
      </header>
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 80px)',
        padding: '20px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <h2 style={{
            marginBottom: '20px',
            color: '#333',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Expense Report
          </h2>
         
        {/* Controls section */}
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  gap: '20px',
  width: '100%',
  flexWrap: 'wrap'
}}>
  {/* Combined time period selector and indicator */}
  <div style={{
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    minWidth: '250px',
    flex: '1 1 400px' // Increased to accommodate both elements
  }}>
    {/* Time period selector */}
    <div style={{ flex: '1 1 200px' }}>
      <select
        value={selectedOption}
        onChange={(e) => setSelectedOption(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #ddd',
          fontSize: '14px',
          backgroundColor: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'border-color 0.2s ease',
          ':focus': {
            outline: 'none',
            borderColor: '#3b82f6',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)'
          }
        }}
      >
        <option value="Selectoption">-- Select Time Period --</option>
        <option value="today">Today</option>
        <option value="ThisWeek">This Week</option>
        <option value="lastWeek">Last Week</option>
        <option value="thisMonth">This Month</option>
        <option value="lastMonth">Last Month</option>
        <option value="thisQuarter">This Quarter</option>
        <option value="lastQuarter">Last Quarter</option>
        <option value="thisFinyear">This Financial Year</option>
        <option value="lastFinancialYear">Last Financial Year</option>
      </select>
    </div>
   
    {/* Display the selected time period - now side by side */}
    {selectedOption && selectedOption !== "Selectoption" && (
      <div style={{
        flex: '1 1 200px',
        padding: '10px',
        background: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #eee',
        fontSize: '14px',
        color: '#555',
        minHeight: '42px', // Match select height
        display: 'flex',
        alignItems: 'center'
      }}>
        <strong style={{ marginRight: '5px' }}>Selected:</strong>
        {selectedOption === "today" ? "Today" :
          selectedOption === "ThisWeek" ? "This Week" :
          selectedOption === "lastWeek" ? "Last Week" :
          selectedOption === "thisMonth" ? "This Month" :
          selectedOption === "lastMonth" ? "Last Month" :
          selectedOption === "thisQuarter" ? "This Quarter" :
          selectedOption === "lastQuarter" ? "Last Quarter" :
          selectedOption === "thisFinyear" ? "This Financial Year" :
          "Last Financial Year"}
      </div>
    )}
  </div>

  {/* Tabs container - remains unchanged */}
  <div style={{
    display: 'flex',
    gap: '10px',
    paddingBottom: '10px',
    flex: '2 1 600px',
    overflowX: 'auto',
    scrollbarWidth: 'none', /* Firefox */
    '::-webkit-scrollbar': { /* Chrome/Safari/Edge */
      display: 'none'
    }
  }}>
    <button
      style={{
        ...tabStyle,
        ...(activeTab === 'maintenance' ? activeTabStyle : {}),
        whiteSpace: 'nowrap'
      }}
      onClick={() => handleTabChange('maintenance')}
    >
      Maintenance
    </button>
    <button
      style={{
        ...tabStyle,
        ...(activeTab === 'depreciation' ? activeTabStyle : {}),
        whiteSpace: 'nowrap'
      }}
      onClick={() => handleTabChange('depreciation')}
    >
      Depreciation
    </button>
    <button
      style={{
        ...tabStyle,
        ...(activeTab === 'goodwill' ? activeTabStyle : {}),
        whiteSpace: 'nowrap'
      }}
      onClick={() => handleTabChange('goodwill')}
    >
      Goodwill
    </button>
    <button
      style={{
        ...tabStyle,
        ...(activeTab === 'expenses' ? activeTabStyle : {}),
        whiteSpace: 'nowrap'
      }}
      onClick={() => handleTabChange('expenses')}
    >
      Expenses
    </button>
    <button
      style={{
        ...tabStyle,
        ...(activeTab === 'scanner' ? activeTabStyle : {}),
        whiteSpace: 'nowrap'
      }}
      onClick={() => handleTabChange('scanner')}
    >
      Scanner
    </button>
<button
  style={{
    ...tabStyle,
    ...(activeTab === 'LEDGER' ? activeTabStyle : {}),
    whiteSpace: 'nowrap'
  }}
  onClick={() => navigate('/ServiceManagementdetails')}
>
  LEDGER
</button>
  </div>
</div>
         
          {/* Tab content area */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #eee',
            borderRadius: '8px',
            backgroundColor: '#fafafa'
          }}>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Image modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }} onClick={closeImageModal}>
          <div style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            backgroundColor: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827'
              }}>Bill Image</h3>
              <button
                onClick={closeImageModal}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  lineHeight: '1',
                  ':hover': {
                    color: '#111827'
                  }
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '20px',
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1
            }}>
              <img
                src={selectedImage}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 100px)',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                alt="Full size bill"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div style={{
              padding: '16px',
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={closeImageModal}
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease',
                  ':hover': {
                    backgroundColor: '#2563eb'
                  }
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Style objects
const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '1px solid #e0e0e0',
    fontWeight: '600',
    fontSize: '14px',
    color: '#333',
    position: 'sticky',
    top: 0
  },
  tableCell: {
    padding: '12px 15px',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px',
    color: '#555'
  }
};

const tabStyle = {
  padding: '10px 16px',
  backgroundColor: '#5a7488',
  color: '#fff',
  border: '1px solid #ddd',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.3s',
  whiteSpace: 'nowrap',
  ':hover': {
    backgroundColor: '#e9ecef'
  }
};

const activeTabStyle = {
  backgroundColor: '#3b82f6',
  color: 'white',
  border: '1px solid #3b82f6',
  ':hover': {
    backgroundColor: '#2563eb'
  }
};

export default ExpenseManagement;
