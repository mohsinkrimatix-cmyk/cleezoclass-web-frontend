import { CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ErrorPopup from "../shared/ErrorPopup";

const SalaryForm = () => {
  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    salary_amount: '',
    basic_salary: '',
    salary_type: '',
    effective_from: '',
    status: 'pending',
    hra: '',
    mediclaim: '',
    pf: '',
    professional_tax: '',
    deductions: '',
    state: 'Karnataka',
    has_loan: false,
    loan_deduction: '',
  });
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const [teacherData, setTeacherData] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch school logo
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) {
        console.warn('No school code found in localStorage.');
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
        }
      } catch (error) {
        console.error('Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, []);

  // Fetch teacher data
  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
      setError('School code not found. Please log in again.');
      return;
    }
    const encodedSchoolCode = encodeURIComponent(schoolCode.trim());
    const apiUrl = `https://cleezoclass.com:4000/api/teach?schoolCode=${encodedSchoolCode}`;
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log('Received teacher data:', data);
        setTeacherData(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Error fetching teacher data:', error);
        setError('Failed to fetch employee data. Please try again.');
      });
  }, []);

  // Auto-calculate PF if basic salary <= 15000
  useEffect(() => {
    if (formData.basic_salary && parseFloat(formData.basic_salary) <= 15000) {
      const pfAmount = (parseFloat(formData.basic_salary) * 0.12).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        pf: pfAmount,
      }));
    }
  }, [formData.basic_salary]);
  const [popup, setPopup] = useState({ message: "", type: "" });

  // Auto-calculate professional tax based on state and salary
  useEffect(() => {
    const salary = parseFloat(formData.salary_amount) || 0;
    let tax = 0;
    if (formData.state === 'Karnataka' && salary > 15000) {
      tax = 200;
    } else if (formData.state === 'Maharashtra' && salary > 7500) {
      tax = 200;
    }
    setFormData((prev) => ({
      ...prev,
      professional_tax: tax,
    }));
  }, [formData.salary_amount, formData.state]);

  const handleIdChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedTeacher = teacherData.find((teacher) => teacher.teacher_id === selectedId);
    setFormData((prevData) => ({
      ...prevData,
      teacher_id: selectedId,
      name: selectedTeacher ? selectedTeacher.teacher_name : '',
    }));
  };

  const handleNameChange = (e) => {
    const selectedName = e.target.value;
    const selectedTeacher = teacherData.find((teacher) => teacher.teacher_name === selectedName);
    setFormData((prevData) => ({
      ...prevData,
      name: selectedName,
      teacher_id: selectedTeacher ? selectedTeacher.teacher_id : '',
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
setPopup({
  message: 'School code not found in localStorage.',
  type: "error" // or "warning", "info", etc.
});
      return;
    }
    const payload = {
      ...formData,
      schoolCode,
      salary_amount: String(formData.salary_amount),
      hra: String(formData.hra),
      mediclaim: String(formData.mediclaim),
      pf: String(formData.pf),
      professional_tax: String(formData.professional_tax),
      deductions: String(formData.deductions),
      loan_deduction: formData.has_loan ? String(formData.loan_deduction) : '0',
    };
    fetch('https://cleezoclass.com:4000/api/add-salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log('Salary submitted:', data);
setPopup({
  message: 'Salary submitted successfully!',
  type: "success"
});
        setFormData({
          teacher_id: '',
          name: '',
          salary_amount: '',
          basic_salary: '',
          salary_type: '',
          effective_from: '',
          status: 'pending',
          hra: '',
          mediclaim: '',
          pf: '',
          professional_tax: '',
          deductions: '',
          state: 'Karnataka',
          has_loan: false,
          loan_deduction: '',
        });
      })
      .catch((error) => {
        console.error('Error submitting salary:', error);
setPopup({
  message: 'Failed to submit salary.',
  type: "error" // or "warning", "info", etc.
});
      });
  };

  return (
    <>
   
      <div className="outer-container">
        <div className="main-content">
          <div className="salary-form-wrapper" style={{
            maxWidth: '1000px',
            width: '100%',
            margin: 'auto',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            backgroundColor: '#f9f9f9'
          }}>
            <style>
              {`
                @media (max-width: 768px) {
                  .salary-form-wrapper { width: 90% !important; padding: 15px !important; }
                  .form-row { flex-direction: column !important; }
                  .form-row > div { width: 100% !important; margin-bottom: 10px !important; }
                }
                @media (max-width: 480px) {
                  .salary-form-wrapper { width: 95% !important; padding: 10px !important; }
                }
                .form-row {
                  display: flex;
                  gap: 15px;
                  margin-bottom: 15px;
                }
                .form-row > div {
                  flex: 1;
                }
                .form-row label {
                  display: block;
                  margin-bottom: 5px;
                  font-weight: bold;
                }
                .form-row input,
                .form-row select {
                  width: 100%;
                  padding: 8px;
                  border-radius: 5px;
                  border: 1px solid #ccc;
                }
              `}
            </style>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Employee Base Salary Entry Form</h2>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div>
                  <label htmlFor="teacher_name">Employee Name:</label>
                  <select
                    id="teacher_name"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  >
                    <option value="">Select Employee Name</option>
                    {teacherData.length === 0 ? (
                      <option value="">No employees found</option>
                    ) : (
                      teacherData.map((teacher) => (
                        <option key={teacher.teacher_id} value={teacher.teacher_name}>
                          {teacher.teacher_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="teacher_id">Employee ID:</label>
                  <select
                    id="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleIdChange}
                    required
                  >
                    <option value="">Select Employee ID</option>
                    {teacherData.map((teacher) => (
                      <option key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.teacher_id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label htmlFor="salary_amount">Gross Salary Amount:</label>
                  <input
                    type="number"
                    id="salary_amount"
                    name="salary_amount"
                    value={formData.salary_amount}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="basic_salary">Basic Salary:</label>
                  <input
                    type="number"
                    id="basic_salary"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="salary_type">Salary Type:</label>
                  <select
                    id="salary_type"
                    name="salary_type"
                    value={formData.salary_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Salary Type</option>
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label htmlFor="hra">HRA:</label>
                  <input
                    type="number"
                    id="hra"
                    name="hra"
                    value={formData.hra}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="mediclaim">BONUS:</label>
                  <input
                    type="number"
                    id="mediclaim"
                    name="mediclaim"
                    value={formData.mediclaim}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="pf">PF (12% of Basic if ≤ ₹15,000):</label>
                  <input
                    type="number"
                    id="pf"
                    name="pf"
                    value={formData.pf}
                    onChange={handleChange}
                    readOnly={formData.basic_salary && parseFloat(formData.basic_salary) <= 15000}
                  />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label htmlFor="deductions">Other Deductions:</label>
                  <input
                    type="number"
                    id="deductions"
                    name="deductions"
                    value={formData.deductions}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="professional_tax">Professional Tax:</label>
                  <input
                    type="number"
                    id="professional_tax"
                    name="professional_tax"
                    value={formData.professional_tax}
                    onChange={handleChange}
                    readOnly
                  />
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      name="has_loan"
                      checked={formData.has_loan}
                      onChange={handleChange}
                    />
                    Has Loan Deduction?
                  </label>
                </div>
              </div>
              {formData.has_loan && (
                <div className="form-row">
                  <div>
                    <label htmlFor="loan_deduction">Loan Deduction Amount:</label>
                    <input
                      type="number"
                      id="loan_deduction"
                      name="loan_deduction"
                      value={formData.loan_deduction}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
              <div className="form-row">
         
                <div>
                  <label htmlFor="effective_from">Effective From:</label>
                  <input
                    type="date"
                    id="effective_from"
                    name="effective_from"
                    value={formData.effective_from}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="status">Status:</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button type="submit" style={{
                  padding: '10px 20px',
                  backgroundColor: '#5a7488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  Submit Base Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
              <ErrorPopup
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup({ message: "", type: "" })}
      />
    </>
  );
};

export default SalaryForm;
