import React, { useState } from 'react';
import axios from 'axios';

function ExcelUploadLead() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = e => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select an Excel file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('https://cleezoclass.com:5000/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(res.data.message + `. Rows inserted: ${res.data.inserted}`);
    } catch (err) {
      console.error(err);
      setMessage('Upload failed');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Upload Excel Sheet</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
        Upload
      </button>
      <p>{message}</p>
    </div>
  );
}

export default ExcelUploadLead;