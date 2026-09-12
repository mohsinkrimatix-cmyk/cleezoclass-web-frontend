import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState('teacher');
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    gender: '',
    phone_no: '',
    aadhar_no: '',
    father_name: '',
    school_name: '',
    address: '',
    dob: '',
    photo: '',
    teaches_to_1: '',
    teaches_to_2: '',
    teaches_to_3: '',
    teaches_to_4: '',
    teaches_to_5: '',
    designation: '',
  });
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const [headerUserPhoto, setHeaderUserPhoto] = useState('');
  const [headerUserName, setHeaderUserName] = useState(localStorage.getItem('name') || 'User');

  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) {
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
        console.error('🔥 Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, []);

  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const schoolCode = localStorage.getItem('schoolCode');
  const username = localStorage.getItem('username');
  const userRole = localStorage.getItem('userRole');

  const normalizeHeaderPhoto = (rawPhoto) => {
    if (!rawPhoto) return '';
    let photo = rawPhoto;

    if (typeof photo === 'object' && photo?.type === 'Buffer' && Array.isArray(photo?.data)) {
      try {
        photo = new TextDecoder().decode(new Uint8Array(photo.data));
      } catch {
        return '';
      }
    }

    if (typeof photo !== 'string') return '';
    photo = photo.trim();
    if (!photo) return '';

    if (photo.startsWith('data:image')) return photo;
    if (photo.startsWith('http')) return photo;

    if (photo.startsWith('0x')) {
      try {
        const hex = photo.slice(2);
        let decoded = '';
        for (let i = 0; i < hex.length; i += 2) {
          decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
        }
        photo = decoded.trim();
      } catch {
        return '';
      }
    }

    if (photo.startsWith('/public/uploads/')) {
      photo = photo.replace('/public', '');
    }

    if (photo.startsWith('uploads/')) {
      photo = `/${photo}`;
    }

    if (photo.startsWith('/uploads/')) {
      return `https://cleezoclass.com:4000${photo}`;
    }

    if (/^[A-Za-z0-9+/=]+$/.test(photo) && photo.length > 100) {
      return `data:image/jpeg;base64,${photo}`;
    }

    return '';
  };

  useEffect(() => {
    const fetchHeaderUser = async () => {
      if (!schoolCode || !username) return;
      try {
        const response = await axios.get(
          `https://cleezoclass.com:4000/api/api/user-info/${username}`,
          { params: { schoolCode } }
        );
        const user = response?.data || {};
        if (user?.name) setHeaderUserName(user.name);
        setHeaderUserPhoto(normalizeHeaderPhoto(user?.photo));
      } catch (err) {
        console.error('Error fetching header user photo:', err.response?.data || err.message);
        setHeaderUserPhoto('');
      }
    };
    fetchHeaderUser();
  }, [schoolCode, username]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 968;

useEffect(() => {
  const fetchAllTeachers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/users', {
        schoolCode,
        user_type: selectedUserType
      });
      console.log('Teachers data:', response.data); // Log the entire response
      response.data.forEach((teacher, index) => {
        console.log(`Teacher ${index + 1} photo:`, teacher.photo); // Log each teacher's photo field
      });
      setTeachers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch teachers');
      console.error('Error fetching teachers:', err);
    } finally {
      setIsLoading(false);
    }
  };
  fetchAllTeachers();
}, [schoolCode, selectedUserType]);


  const handleEditClick = (teacher) => {
    setEditingTeacher(teacher.id);
    setEditFormData({
      name: teacher.name || '',
      username: teacher.username || '',
      gender: teacher.gender || '',
      phone_no: teacher.phone_no || '',
      aadhar_no: teacher.aadhar_no || '',
      father_name: teacher.father_name || '',
      school_name: teacher.school_name || '',
      address: teacher.address || '',
      dob: teacher.dob || '',
      photo: teacher.photo || '',
      teaches_to_1: teacher.teaches_to_1 || '',
      teaches_to_2: teacher.teaches_to_2 || '',
      teaches_to_3: teacher.teaches_to_3 || '',
      teaches_to_4: teacher.teaches_to_4 || '',
      teaches_to_5: teacher.teaches_to_5 || '',
      designation: teacher.designation || '',
    });
    // Set the photo preview using the URL directly
    setPhotoPreview(teacher.photo ? `https://cleezoclass.com:4000${teacher.photo}` : '');
    setPhotoFile(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (photoFile, teacherId) => {
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
      throw new Error('School code not found in local storage');
    }
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('schoolCode', schoolCode);
    formData.append('teacherId', teacherId);
    try {
      // Use the correct endpoint for photo upload
      const response = await axios.post(
        'https://cleezoclass.com:4000/upload-photo-teacherdatainsertion',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await axios.delete(`https://cleezoclass.com:4000/api/users/${teacherId}`, { data: { schoolCode } });
        const response = await axios.post('https://cleezoclass.com:4000/api/users', { schoolCode, user_type: selectedUserType });
        setTeachers(response.data);
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let photoPath = editFormData.photo;
      if (photoFile) {
        // Upload the new photo and get the new path
        const uploadResponse = await uploadPhoto(photoFile, editingTeacher);
        photoPath = uploadResponse.photoPath;
      }
      
      // Update the teacher with the new photo path
      await axios.put(`https://cleezoclass.com:4000/api/users/${editingTeacher}`, {
        ...editFormData,
        photo: photoPath,
        schoolCode,
      });
      const response = await axios.post('https://cleezoclass.com:4000/api/users', { schoolCode, user_type: selectedUserType });
      setTeachers(response.data);
      setEditingTeacher(null);
      setPhotoFile(null);
      setPhotoPreview('');
      setError(null);
    } catch (err) {
      setError('Failed to update teacher');
      console.error('Error updating teacher:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingTeacher(null);
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleDownload = async () => {
    const input = document.querySelector('.main-content');
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
      pdf.save('Teachers.pdf');
    } catch (error) {
      console.error('Error generating full PDF:', error);
    } finally {
      input.style.height = originalStyle.height;
      input.style.overflow = originalStyle.overflow;
    }
  };

  const handleShare = async () => {
    const input = document.querySelector('.main-content');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 0, 0);
    const blob = pdf.output('blob');
    const file = new File([blob], 'teachers.pdf', { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Teachers Report',
          text: 'Please find the Teachers report attached.',
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

  const styles = {
    filterGroup: {
      flex: '1',
      minWidth: '250px'
    },
    filterLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#34495e'
    },
    select: {
      width: '100%',
      padding: '10px',
      fontSize: '16px',
      borderRadius: '4px',
      border: '1px solid #bdc3c7',
      backgroundColor: 'white'
    },
    error: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '15px',
      border: '1px solid #f5c6cb'
    },
    loading: {
      backgroundColor: '#d1ecf1',
      color: '#0c5460',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '15px',
      border: '1px solid #bee5eb'
    },
    resultsContainer: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    resultsHeader: {
      color: '#2c3e50',
      marginBottom: '15px',
      paddingBottom: '10px',
      borderBottom: '1px solid #ecf0f1',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    resultCount: {
      fontSize: '14px',
      color: '#7f8c8d',
      fontWeight: 'normal'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#7f8c8d',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      fontStyle: 'italic'
    },
    tableContainer: {
      overflowX: 'auto',
      borderRadius: '4px',
      border: '1px solid #dfe6e9',
      width: '100%',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: isMobile ? '12px' : '14px',
      minWidth: '600px',
    },
    tableHeaderRow: {
      backgroundColor: '#2c3e50',
      color: 'white'
    },
    tableHeader: {
      padding: isMobile ? '8px 10px' : '12px 15px',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: isMobile ? '12px' : 'inherit',
    },
    tableRow: {
      borderBottom: '1px solid #dfe6e9',
      ':hover': {
        backgroundColor: '#f8f9fa'
      }
    },
    tableCell: {
      padding: isMobile ? '8px 10px' : '12px 15px',
      verticalAlign: 'middle',
      fontSize: isMobile ? '12px' : 'inherit',
    },
    editButton: {
      padding: '6px 12px',
      marginRight: '8px',
      backgroundColor: '#ffe8e8',
      color: 'white',
      border: '1px solid #ff6b6b',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      ':disabled': {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed'
      }
    },
    formRowThree: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
      marginBottom: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    classGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '10px'
    },
    classInputWrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    deleteButton: {
      padding: '6px 12px',
      backgroundColor: '#ffe8e8',
      color: 'white',
      border: '1px solid #ff6b6b',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      ':disabled': {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed'
      }
    },
    editFormContainer: {
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dfe6e9'
    },
    editFormHeader: {
      color: '#2c3e50',
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: '1px solid #3498db'
    },
    editForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    formSection: {
      backgroundColor: 'white',
      padding: '15px',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sectionHeader: {
      color: '#3498db',
      marginBottom: '15px',
      paddingBottom: '5px',
      borderBottom: '1px solid #ecf0f1'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '15px'
    },
    formGroup: {
      marginBottom: '10px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '500',
      color: '#34495e',
      fontSize: '14px'
    },
    formInput: {
      width: '100%',
      padding: '8px',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '14px',
      ':focus': {
        outline: 'none',
        borderColor: '#3498db',
        boxShadow: '0 0 0 2px rgba(52,152,219,0.2)'
      }
    },
    formActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px'
    },
    saveButton: {
      padding: '8px 20px',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      ':disabled': {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed'
      }
    },
    teacherPhoto: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    photoPlaceholder: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      color: '#666'
    },
    photoPreview: {
      width: '120px',
      height: '120px',
      borderRadius: '4px',
      objectFit: 'cover',
      border: '1px solid #ddd'
    },
    photoPlaceholderLarge: {
      width: '120px',
      height: '120px',
      backgroundColor: '#eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      color: '#666',
      borderRadius: '4px'
    },
    uploadButton: {
      padding: '8px 15px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      marginRight: '10px'
    },
    removeButton: {
      padding: '8px 15px',
      backgroundColor: '#e74c3c',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      width: '80%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    modalTitle: {
      marginBottom: '20px',
      color: '#333',
      borderBottom: '1px solid #eee',
      paddingBottom: '10px',
    },
    modalForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
    formRow: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    formLabel: {
      fontWeight: 'bold',
      fontSize: '14px',
    },
    modalButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px',
    },
    teachesBadge: {
      backgroundColor: '#e0e0e0',
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      whiteSpace: 'nowrap'
    },
    cancelButton: {
      padding: '8px 20px',
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      ':disabled': {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed'
      }
    }
  };

  const linkStyle = {
    margin: "0 10px",
    textDecoration: "none",
    display: "flex",
    alignItems: "center"
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

  const headingStyle = {
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: isMobile ? '20px' : '32px',
    fontWeight: 'bold'
  };

  const buttonStyle = {
    padding: isMobile ? '12px' : '18px',
    fontSize: isMobile ? '14px' : '18px',
    backgroundColor: '#5a7488',
    color: 'white',
    border: 'none',
    fontWeight: 'bold',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '400px',
    display: 'block',
    margin: '0 auto 20px auto',
  };

  return (
    <div>

      <div className="outer-container">
     
        <div className="main-content">
       
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f4f6f9',
            padding: '20px',
          }}>

            <div style={{
              padding: '20px',
              fontFamily: 'Arial, sans-serif',
              maxWidth: '100%',
              width: '100%',
              backgroundColor: '#f4f6f9',
              boxSizing: 'border-box',
              overflowX: 'auto',
              cursor: 'default'
            }}>
                         <button
  onClick={() => navigate(-1)}
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "50%",
    background: "#f1f5f9",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
  }}
>
  <ArrowLeft size={20} color="#334155" />
</button>
              <h1 style={headingStyle}>Teacher Management System</h1>
              <button onClick={() => navigate('/TeacherUpload')} style={buttonStyle}>
                📤 CLICK HERE TO UPLOAD TEACHERS DATA
              </button>
              <div style={{ ...styles.filterGroup, maxWidth: '320px', marginBottom: '15px' }}>
                <label style={styles.filterLabel}>User Type</label>
                <select
                  value={selectedUserType}
                  onChange={(e) => setSelectedUserType(e.target.value)}
                  style={styles.select}
                >
                  <option value="teacher">Teacher</option>
                  <option value="management">Management</option>
                </select>
              </div>
              {error && <div style={styles.error}>{error}</div>}
              {isLoading && <div style={styles.loading}>Loading...</div>}
              {editingTeacher && (
                <div style={styles.modalOverlay}>
                  <div style={styles.modalContent}>
                    <h2 style={styles.modalTitle}>Edit Teacher</h2>
                    <div style={styles.modalForm}>
                      <div style={styles.formRowThree}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Name:</label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleFormChange}
                            style={styles.formInput}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Username:</label>
                          <input
                            type="text"
                            name="username"
                            value={editFormData.username}
                            onChange={handleFormChange}
                            style={styles.formInput}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Father's Name:</label>
                          <input
                            type="text"
                            name="father_name"
                            value={editFormData.father_name}
                            onChange={handleFormChange}
                            style={styles.formInput}
                          />
                        </div>
                      </div>
                      <div style={styles.formRowThree}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Gender:</label>
                          <select
                            name="gender"
                            value={editFormData.gender}
                            onChange={handleFormChange}
                            style={styles.formInput}
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Phone:</label>
                          <input
                            type="text"
                            name="phone_no"
                            value={editFormData.phone_no}
                            onChange={handleFormChange}
                            style={styles.formInput}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Aadhar:</label>
                          <input
                            type="text"
                            name="aadhar_no"
                            value={editFormData.aadhar_no}
                            onChange={handleFormChange}
                            style={styles.formInput}
                          />
                        </div>
                      </div>
                      <div style={styles.formRow}>
                        <label style={styles.formLabel}>Photo:</label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handlePhotoChange}
                          style={{ display: 'none' }}
                        />
                        <button type="button" onClick={triggerFileInput} style={styles.uploadButton}>
                          Upload Photo
                        </button>
                        {photoPreview && (
                          <img
                            src={photoPreview}
                            alt="Preview"
                            style={styles.photoPreview}
                          />
                        )}
                      </div>
                      <div style={styles.formRowThree}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Designation:</label>
                          <input
                            type="text"
                            name="designation"
                            value={editFormData.designation}
                            onChange={handleFormChange}
                            style={styles.formInput}
                          />
                        </div>
                        <div style={styles.formGroup}>
                        </div>
                        <div style={styles.formGroup}>
                        </div>
                      </div>
                      <div style={styles.formRow}>
                        <label style={styles.formLabel}>Teaches To:</label>
                        <div style={styles.classGrid}>
                          {[...Array(12)].map((_, i) => (
                            <div key={`teaches_to_${i + 1}`} style={styles.classInputWrapper}>
                              <input
                                type="text"
                                name={`teaches_to_${i + 1}`}
                                value={editFormData[`teaches_to_${i + 1}`] || ''}
                                onChange={handleFormChange}
                                style={styles.formInput}
                                placeholder={`Class ${i + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={styles.modalButtons}>
                        <button type="button" onClick={handleSubmit} style={styles.saveButton}>
                          Save Changes
                        </button>
                        <button type="button" onClick={cancelEdit} style={styles.cancelButton}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div style={styles.resultsContainer}>
                <h2 style={styles.resultsHeader}>
                  {selectedUserType === 'management' ? 'All Management Users' : 'All Teachers'}
                  <span style={styles.resultCount}>Total: {teachers.length}</span>
                </h2>
                {teachers.length === 0 ? (
                  <div style={styles.emptyState}>
                    {selectedUserType === 'management' ? 'No management users found' : 'No teachers found'}
                  </div>
                ) : (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeaderRow}>
                          <th style={styles.tableHeader}>ID</th>
                          <th style={styles.tableHeader}>Name</th>
                          <th style={styles.tableHeader}>Username</th>
                          <th style={styles.tableHeader}>Father</th>
                          <th style={styles.tableHeader}>Gender</th>
                          <th style={styles.tableHeader}>Phone</th>
                          <th style={styles.tableHeader}>Aadhar</th>
                          <th style={styles.tableHeader}>Photo</th>
                          <th style={styles.tableHeader}>Teaches To</th>
                          <th style={styles.tableHeader}>Designation</th>
                          <th style={styles.tableHeader}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((teacher) => (
                          <tr key={teacher.id} style={styles.tableRow}>
                            <td style={styles.tableCell}>{teacher.id}</td>
                            <td style={styles.tableCell}>{teacher.name}</td>
                            <td style={styles.tableCell}>{teacher.username || '-'}</td>
                            <td style={styles.tableCell}>{teacher.father_name || '-'}</td>
                            <td style={styles.tableCell}>{teacher.gender || '-'}</td>
                            <td style={styles.tableCell}>{teacher.phone_no || '-'}</td>
                            <td style={styles.tableCell}>{teacher.aadhar_no || '-'}</td>
                       <td style={styles.tableCell}>
  {teacher.photo ? (
    <img
      src={teacher.photo}
      alt="Teacher"
      style={styles.teacherPhoto}
    />
  ) : (
    <div style={styles.photoPlaceholder}>No Photo</div>
  )}
</td>

                            <td style={styles.tableCell}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {[...Array(12)].map((_, i) => {
                                  const teachesTo = teacher[`teaches_to_${i + 1}`];
                                  return teachesTo ? (
                                    <span key={`teaches-${i}`} style={styles.teachesBadge}>
                                      {teachesTo}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </td>
                            <td style={styles.tableCell}>{teacher.designation || '-'}</td>
                            <td style={styles.tableCell}>
                              <button
                                onClick={() => handleEditClick(teacher)}
                                style={styles.editButton}
                                disabled={isLoading}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(teacher.id)}
                                style={styles.deleteButton}
                                disabled={isLoading}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherManagement;
