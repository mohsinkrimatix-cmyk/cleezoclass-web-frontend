import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalaryDashboard = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalaries = async () => {
      const schoolCode = localStorage.getItem('schoolCode');
      if (!schoolCode) {
        setError('School code not found in localStorage');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('https://cleezoclass.com:4000/api/getSalary', {
          params: { schoolCode }
        });
        setSalaries(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSalaries();
  }, []);

  const paidSalaries = salaries.filter(salary => salary.status === 'paid');
  const unpaidSalaries = salaries.filter(salary => salary.status === 'unpaid');

  const SalaryTable = ({ data, title }) => (
    <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1rem', overflowX: 'auto', maxWidth:'1400px',widtH:'100%' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', textAlign: 'center' }}>
        {title} ({data.length})
      </h2>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
        <thead style={{ backgroundColor: '#1f2937', color: 'white' }}>
          <tr>
            <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'left' }}>Teacher Name</th>
            <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'right' }}>Salary Amount</th>
            <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'center' }}>Payment Date</th>
            <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'center' }}>Salary Type</th>
            <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'center' }}>Status</th>
            <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'center' }}>Effective From</th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: 'white' }}>
          {data.length > 0 ? (
            data.map((salary) => (
              <tr key={salary.salary_id} style={{ backgroundColor: 'white', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db' }}>{salary.teacher_name}</td>
                <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'right' }}>{salary.salary_amount}</td>
                <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'center' }}>{salary.payment_date}</td>
                <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'center' }}>{salary.salary_type}</td>
                <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    backgroundColor: salary.status === 'paid' ? '#dcfce7' : '#fee2e2',
                    color: salary.status === 'paid' ? '#166534' : '#991b1b'
                  }}>
                    {salary.status}
                  </span>
                </td>
                <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'center' }}>{salary.effective_from}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)', padding: '1.5rem', margin: '0 auto' , width:'1400px'}}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Teacher Salary Details</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <SalaryTable data={paidSalaries} title="Paid Salaries" />
            <SalaryTable data={unpaidSalaries} title="Unpaid Salaries" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryDashboard;
