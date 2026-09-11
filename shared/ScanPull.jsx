import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ScanPull = () => {
  const [pendingClasses, setPendingClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get('https://cleezoclass.com:5000/api/pending-classes')
      .then(res => setPendingClasses(res.data))
      .catch(err => setError('Failed to load pending classes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFEB3B' }} /> Pending Classes
      </h2>

      <select style={{ padding: '5px', width: '100%', marginTop: '20px' }}>
        <option value="">Select Pending Class</option>
        {loading ? (
          <option>Loading...</option>
        ) : pendingClasses.length > 0 ? (
          pendingClasses.map((cls, idx) => (
            <option key={idx} value={`${cls.class_name}-${cls.section}`}>
              Class {cls.class_name} Section {cls.section}
            </option>
          ))
        ) : (
          <option disabled>No Pending Classes</option>
        )}
      </select>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default ScanPull;
