import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Download, Circle, X, CheckCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import StudentEditingPopup from './StudentEditingPopup.jsx';
import { color } from 'framer-motion';
import GlobalLoader from './GlobelLoading.js';

const createAddUserForm = (userType, defaults = {}) => ({
  user_type: userType,
  name: '',
  username: '',
  password: '',
  gender: '',
  phone_no: '',
  father_phone_no: '',
  aadhar_no: '',
  father_name: '',
  class_name: '',
  section: '',
  class_teacher: '',
  school_name: '',
  address: '',
  dob: '',
  photo: '',
  admission_no: '',
  cbse_reg_no: '',
  curriculum: '',
  designation: '',
  teaches_to_1: '',
  teaches_to_2: '',
  teaches_to_3: '',
  teaches_to_4: '',
  teaches_to_5: '',
  teaches_to_6: '',
  teaches_to_7: '',
  teaches_to_8: '',
  teaches_to_9: '',
  teaches_to_10: '',
  teaches_to_11: '',
  teaches_to_12: '',
  ...defaults,
});

const managementDesignationOptions = [
  { label: 'Correspondent', value: 'superadmin' },
  { label: 'Principal', value: 'admin' },
  { label: 'Campaigning', value: 'marketing' },
  { label: 'Accountant', value: 'accountant' },
  { label: 'HR', value: 'hr' },
  { label: 'Bus Manager', value: 'Bus Manager' },
  { label: 'Bus Driver', value: 'Bus Driver' }
];

const initialFormData = {
  school_name: '',
  curriculum: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  school_code: '',
  school_strength: '',
  staff_strength: '',
  tagline: '',
  registration_no: '',
  authorized_logo: null,
  school_photo: null,
  correspondent: null,
  front_office: null,
  other_photo: null,
  latitude: '',
  longitude: '',
  radius: '',
  use_radius: '',
  institute_authorized_person: '',
  email: '',
  email_app_key: ''
};

const photoFields = [
  { key: 'school_photo', label: 'School Photo *' },
  { key: 'correspondent', label: 'Correspondent' },
  { key: 'front_office', label: 'Front Office' },
  { key: 'other_photo', label: 'Other' }
];

const cameraIcon = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="10" y="18" width="44" height="30" rx="6" fill="#d9d9d9" stroke="#888" stroke-width="3"/><path d="M22 18l4-6h12l4 6" fill="#d9d9d9" stroke="#888" stroke-width="3"/><circle cx="32" cy="33" r="9" fill="#fff" stroke="#888" stroke-width="3"/></svg>')}`;
const applicationIcon = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="12" y="12" width="40" height="40" rx="8" fill="#2b6cb0"/><path d="M24 32h16M32 24l8 8-8 8" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>')}`;

const clickHiddenInput = (id) => { document.getElementById(id)?.click(); };

const normalizePhotoUrl = (rawPhoto) => {
  if (!rawPhoto) return '';
  let photoPath = rawPhoto;
  if (typeof photoPath === 'object' && photoPath.type === 'Buffer' && Array.isArray(photoPath.data)) {
    try {
      photoPath = new TextDecoder().decode(new Uint8Array(photoPath.data));
    } catch {
      return '';
    }
  }
  if (typeof photoPath !== 'string') return '';
  photoPath = photoPath.trim();
  if (!photoPath) return '';
  if (photoPath.startsWith('data:image') || photoPath.startsWith('http')) return photoPath;
  if (photoPath.startsWith('0x')) {
    try {
      const hex = photoPath.slice(2);
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
      photoPath = decoded.trim();
    } catch {
      return '';
    }
  }
  if (photoPath.startsWith('/public/uploads/')) photoPath = photoPath.replace('/public', '');
  if (photoPath.startsWith('uploads/')) photoPath = `/${photoPath}`;
  if (!photoPath.startsWith('/uploads/')) photoPath = `/uploads/${photoPath.replace(/^\/+/, '')}`;
  return `https://cleezoclass.com:4000${photoPath}`;
};

const roleTabConfig = {
  Management: {
    title: 'Management Bulk Upload',
    detailsTitle: 'Management Details',
    addButtonLabel: 'Add Management',
    userType: 'management',
    templateCategory: 'Management',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'phone', label: 'Phone' },
      { key: 'designation', label: 'Designation' }
    ]
  },
  Staff: {
    title: 'Teacher Bulk Upload',
    detailsTitle: 'Teacher Details',
    addButtonLabel: 'Add Staff',
    userType: 'teacher',
    templateCategory: 'Staff',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'phone', label: 'Phone' },
      { key: 'designation', label: 'Designation' }
    ]
  },
  Student: {
    title: 'Student Bulk Upload',
    detailsTitle: 'Student Details',
    addButtonLabel: 'Add Student',
    userType: 'student',
    templateCategory: 'Student',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'phone', label: 'Phone' },
      { key: 'class_name', label: 'Class' },
      { key: 'section', label: 'Section' },
      { key: 'class_teacher', label: 'Class Teacher' }
    ]
  }
};


const TeacherUpload = () => {
  // ... (All your state declarations remain the same, just without type annotations) ...
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Management');
  const [formData, setFormData] = useState(initialFormData);
  const [uploading, setUploading] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadedData, setUploadedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [previewCategory, setPreviewCategory] = useState('Student');
  const [trackingStats, setTrackingStats] = useState({ teacher: 0, student: 0, management: 0 });
  const [roleUsers, setRoleUsers] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [actionUser, setActionUser] = useState(null);
  const [studentClassFilter, setStudentClassFilter] = useState('');
  const [studentSectionFilter, setStudentSectionFilter] = useState('');
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddUserSubmitting, setIsAddUserSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userModalMode, setUserModalMode] = useState('add');
  const [studentPhotoPreview, setStudentPhotoPreview] = useState('');
  const [studentPhotoFile, setStudentPhotoFile] = useState(null);
  const studentPhotoInputRef = useRef(null);
  const [addUserForm, setAddUserForm] = useState(createAddUserForm('student'));
const [currentPage, setCurrentPage] = useState(1);
const recordsPerPage = 25;
  const activeRoleTab = activeTab === 'Management' || activeTab === 'Staff' || activeTab === 'Student' ? activeTab : null;

  const openUploadPopup = () => { setExcelFile(null); setPreviewData([]); setUploadedData([]); setShowUploadPopup(true); };
  const closeUploadPopup = () => { setShowUploadPopup(false); setExcelFile(null); setPreviewData([]); setUploadedData([]); };
const tableContainerRef = useRef(null);


useEffect(() => {
  if (tableContainerRef.current) {
    tableContainerRef.current.scrollTop = 0;
  }
}, [currentPage]); 

const handlePageChange = (newPage) => {
  setCurrentPage(newPage);
};

  useEffect(() => {
    const loadSchoolDetails = async () => {
      const username = localStorage.getItem('username');
      const schoolCode = localStorage.getItem('schoolCode');
      const instituteName = localStorage.getItem('instituteName');
      if (!username && !schoolCode && !instituteName) return;
      try {
        const query = new URLSearchParams();
        if (username) query.set('username', username);
        if (schoolCode) query.set('schoolCode', schoolCode);
        if (instituteName) query.set('instituteName', String(instituteName));
        const url = `https://cleezoclass.com:4000/api/school-lookup?${query.toString()}`;
        const res = await axios.get(url);
        const data = res.data;
        if (!data) return;
        const resolvedSchoolCode = data.school_code || schoolCode || '';
        const resolvedInstituteName = data.institute_name || instituteName || '';
        if (resolvedSchoolCode) localStorage.setItem('schoolCode', resolvedSchoolCode);
        if (resolvedInstituteName) localStorage.setItem('instituteName', resolvedInstituteName);
        setFormData({
          school_name: resolvedInstituteName,
          curriculum: data.curriculum || '',
          address: data.institute_address || '',
          city: data.city_name || '',
          state: data.state || '',
          pincode: data.pincode || '',
          school_code: resolvedSchoolCode,
          school_strength: data.number_of_students || '',
          staff_strength: data.number_of_staff || '',
          tagline: data.tagline || '',
          registration_no: data.registration_no || '',
          authorized_logo: data.logo || data.authorized_logo || null,
          school_photo: data.school_photo || null,
          correspondent: data.correspondent || null,
          front_office: data.front_office || null,
          other_photo: data.other_photo || null,
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          radius: data.radius || '',
          use_radius: data.use_radius || '',
          institute_authorized_person: data.institute_authorized_person || '',
          email: data.email || '',
          email_app_key: data.email_app_key || ''
        });
      } catch (err) { console.error('Fetch error:', err); }
    };
    loadSchoolDetails();
  }, []);

  useEffect(() => {
    const loadRoleUsers = async () => {
      if (!activeRoleTab) return;
      const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
      if (!schoolCode) return;
      try {
        setRoleLoading(true);
        const response = await axios.post('https://cleezoclass.com:4000/api/users', { schoolCode, user_type: roleTabConfig[activeRoleTab].userType });
        setRoleUsers(Array.isArray(response.data) ? response.data : []);
      } catch (error) { console.error(`Failed to fetch ${activeRoleTab.toLowerCase()} users:`, error); setRoleUsers([]); } 
      finally { setRoleLoading(false); }
    };
    loadRoleUsers();
  }, [activeRoleTab, formData.school_code]);

  const handleChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
  const handlePhotoChange = (e, key) => { const file = e.target.files?.[0] ?? null; setFormData((prev) => ({ ...prev, [key]: file })); };

  const uploadStudentPhoto = async () => {
    if (!studentPhotoFile) return addUserForm.photo || '';
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    const uploadData = new FormData();
    uploadData.append('photo', studentPhotoFile);
    const response = await axios.post('https://cleezoclass.com:4000/api/upload-photo', uploadData, { headers: { 'Content-Type': 'multipart/form-data' }, params: { schoolCode } });
    return response.data?.photoPath || addUserForm.photo || '';
  };

  const getStudentSectionsForClass = (className) => Array.from(new Set(roleUsers.filter((user) => String(user?.class_name || '').trim() === String(className).trim()).map((user) => String(user?.section || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const openAddUserModal = (userType) => { setUserModalMode('add'); setEditingUserId(null); setCreatedCredentials(null); setStudentPhotoFile(null); setStudentPhotoPreview(''); setAddUserForm(createAddUserForm(userType, { school_name: formData.school_name || localStorage.getItem('instituteName') || '', address: formData.address || '', curriculum: formData.curriculum || '' })); setIsAddUserOpen(true); };
  const closeAddUserModal = () => { setIsAddUserOpen(false); setCreatedCredentials(null); setEditingUserId(null); setUserModalMode('add'); setStudentPhotoFile(null); setStudentPhotoPreview(''); };

  const buildUserFormFromRecord = (userType, user) => createAddUserForm(userType, { name: String(user?.name || ''), username: String(user?.username || ''), password: String(user?.password || ''), gender: String(user?.gender || ''), phone_no: String(user?.phone_no || user?.phone || ''), father_phone_no: String(user?.father_phone_no || ''), aadhar_no: String(user?.aadhar_no || ''), father_name: String(user?.father_name || ''), class_name: String(user?.class_name || ''), section: String(user?.section || ''), class_teacher: String(user?.class_teacher || ''), school_name: String(user?.school_name || formData.school_name || ''), address: String(user?.address || formData.address || ''), dob: String(user?.dob || ''), photo: normalizePhotoUrl(user?.photo) || String(user?.photo || ''), admission_no: String(user?.admission_no || ''), cbse_reg_no: String(user?.cbse_reg_no || ''), curriculum: String(user?.curriculum || formData.curriculum || ''), designation: String(user?.designation || ''), teaches_to_1: String(user?.teaches_to_1 || ''), teaches_to_2: String(user?.teaches_to_2 || ''), teaches_to_3: String(user?.teaches_to_3 || ''), teaches_to_4: String(user?.teaches_to_4 || ''), teaches_to_5: String(user?.teaches_to_5 || ''), teaches_to_6: String(user?.teaches_to_6 || ''), teaches_to_7: String(user?.teaches_to_7 || ''), teaches_to_8: String(user?.teaches_to_8 || ''), teaches_to_9: String(user?.teaches_to_9 || ''), teaches_to_10: String(user?.teaches_to_10 || ''), teaches_to_11: String(user?.teaches_to_11 || ''), teaches_to_12: String(user?.teaches_to_12 || '') });

  const openEditUserModal = (user) => {
    const userType = (user?.user_type || (activeRoleTab === 'Staff' ? 'teacher' : activeRoleTab === 'Student' ? 'student' : 'management'));
    const resolvedId = user?.id ?? user?.ID ?? user?.Id ?? user?.user_id ?? user?.userId ?? user?.staff_id ?? user?.management_id ?? null;
    if (resolvedId == null || resolvedId === '') { alert('This record does not have a valid id.'); return; }
    setUserModalMode('edit'); setEditingUserId(resolvedId); setCreatedCredentials(null); setAddUserForm(buildUserFormFromRecord(userType, user)); setStudentPhotoFile(null); setStudentPhotoPreview(normalizePhotoUrl(user?.photo)); setIsAddUserOpen(true);
  };

  const handleAddUserChange = (e) => {
    const { name, value } = e.target;
    const field = name;
    const nameRegex = /^[A-Za-z\s'-]*$/;
    if ((field === 'name' || field === 'father_name') && !nameRegex.test(value)) return;
    setAddUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    if (!schoolCode) { alert('School Code missing'); return; }
    const userType = addUserForm.user_type;
    try {
      setIsAddUserSubmitting(true);
      if (userModalMode === 'edit' && editingUserId != null) {
        const photoPath = studentPhotoFile ? await uploadStudentPhoto() : addUserForm.photo || '';
        const editPayload = { ...addUserForm, photo: typeof photoPath === 'string' ? photoPath : '' };
        await axios.put(`https://cleezoclass.com:4000/api/users/${editingUserId}`, editPayload, { params: { schoolCode }, headers: { 'Content-Type': 'application/json' } });
        alert(`${userType} updated successfully`);
      } else {
        const photoPath = studentPhotoFile ? await uploadStudentPhoto() : '';
        const addPayload = { ...addUserForm, photo: typeof photoPath === 'string' ? photoPath : '', schoolCode, category: userType };
        const response = await axios.post('https://cleezoclass.com:4000/api/submit-studentData', addPayload, { params: { schoolCode }, headers: { 'Content-Type': 'application/json' } });
        const responseData = response.data?.data || {};
        setCreatedCredentials({ name: String(responseData.name || addUserForm.name || ''), username: String(responseData.username || addUserForm.username || ''), password: String(responseData.password || addUserForm.password || ''), user_type: userType });
        alert(`${userType} added successfully`);
      }
      await reloadRoleUsers();
      setAddUserForm(createAddUserForm(userType)); setEditingUserId(null);
      if (userModalMode === 'edit') setIsAddUserOpen(false); else setUserModalMode('add');
    } catch (error) { alert(error?.response?.data?.message || 'Failed to save user'); } 
    finally { setIsAddUserSubmitting(false); }
  };

  const reloadRoleUsers = async () => {
    if (!activeRoleTab) return;
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    if (!schoolCode) return;
    const response = await axios.post('https://cleezoclass.com:4000/api/users', { schoolCode, user_type: roleTabConfig[activeRoleTab].userType });
    setRoleUsers(Array.isArray(response.data) ? response.data : []);
  };

  const copyCredentials = async (text) => { try { await navigator.clipboard.writeText(text); } catch {} };

  const handleUpdate = () => {
    const schoolCode = localStorage.getItem('schoolCode');
    const uploadData = new FormData();
    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      if (key === 'authorized_logo') {
        if (value instanceof File) uploadData.append('logo', value);
        return;
      }
      uploadData.append(key, value instanceof File ? value : value ?? '');
    });
    axios.put(`https://cleezoclass.com:4000/api/api/schooleditingdatacentralization/${schoolCode}`, uploadData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(() => alert('Updated successfully')).catch(() => alert('Update failed'));
  };

  const handleFileUpload = async (category) => {
    if (!excelFile) { alert('Please choose an Excel file first'); return; }
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    if (!schoolCode) { alert('School Code missing'); return; }
    const uploadData = new FormData();
    uploadData.append('file', excelFile);
    uploadData.append('school_code', schoolCode);
    try {
      setUploading(true);
      setPreviewCategory(getUploadPreviewCategory(activeRoleTab));
      const apiCategory = category.toLowerCase() === 'staff' ? 'teacher' : category.toLowerCase();
      const response = await axios.post(`https://cleezoclass.com:4000/api/upload-excel/${apiCategory}`, uploadData, { params: { schoolCode }, headers: { 'Content-Type': 'multipart/form-data' } });
      const { insertedRecords, duplicates, replacedRecords = [], skippedRows = 0 } = response.data;
      setUploadedData(insertedRecords);
      setPreviewData(insertedRecords);
      alert(`Upload Successful!\nInserted: ${insertedRecords.length}\nReplaced: ${replacedRecords.length || duplicates.length}\nSkipped: ${skippedRows}`);
      setExcelFile(null);
      await reloadRoleUsers();
    } catch (error) { console.error('Excel upload failed:', error); alert('Excel upload failed'); } 
    finally { setUploading(false); }
  };

  const getExcelTemplateHeaders = (category) => {
    const baseHeaders = ['name', 'gender', 'dob', 'phone_no', 'aadhar_no', 'father_name', 'address'];
    const studentHeaders = [...baseHeaders, 'class_name', 'section', 'class_teacher', 'admission_no', 'curriculum', 'cbse_reg_no'];
    const teacherHeaders = [...baseHeaders, 'designation', 'teaches_to_1', 'teaches_to_2', 'teaches_to_3', 'teaches_to_4', 'teaches_to_5', 'teaches_to_6', 'teaches_to_7', 'teaches_to_8', 'teaches_to_9', 'teaches_to_10', 'teaches_to_11', 'teaches_to_12'];
    const managementHeaders = [...baseHeaders, 'designation'];
    if (category === 'Staff') return teacherHeaders;
    if (category === 'Management') return managementHeaders;
    return studentHeaders;
  };

  const downloadExcelTemplate = (category) => {
    const headers = getExcelTemplateHeaders(category);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(workbook, worksheet, `${category}Template`);
    XLSX.writeFile(workbook, `${category === 'Staff' ? 'teacher' : category.toLowerCase()}_template.xlsx`);
  };

  const handlePreview = (file, category) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      setPreviewData(rawData);
      setPreviewCategory(category);
    };
    reader.readAsBinaryString(file);
  };

  const downloadExcel = () => {
    if (uploadedData.length === 0) { alert('No data to download'); return; }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(uploadedData);
    XLSX.utils.book_append_sheet(wb, ws, 'UploadedData');
    XLSX.writeFile(wb, 'uploaded_data.xlsx');
  };

  const formatExcelColumnLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const formatExcelCellValue = (value) => { if (value === null || value === undefined) return '-'; if (typeof value === 'string') return value.trim() || '-'; if (typeof value === 'number' || typeof value === 'boolean') return String(value); return String(value); };
  const getUploadPreviewCategory = (roleTab) => roleTab === 'Staff' ? 'Staff' : roleTab === 'Management' ? 'Management' : 'Student';

  const filteredRoleUsers = activeRoleTab === 'Student' ? roleUsers.filter((user) => {
    const classMatch = studentClassFilter ? String(user?.class_name || '').trim().toLowerCase() === String(studentClassFilter).trim().toLowerCase() : true;
    const sectionMatch = studentSectionFilter ? String(user?.section || '').trim().toLowerCase() === String(studentSectionFilter).trim().toLowerCase() : true;
    const nameMatch = studentNameFilter ? String(user?.name || '').trim().toLowerCase().includes(String(studentNameFilter).trim().toLowerCase()) : true;
    return classMatch && sectionMatch && nameMatch;
  }) : roleUsers;

  const studentClassOptions = Array.from(new Set(roleUsers.map((user) => String(user?.class_name || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const studentSectionOptions = Array.from(new Set(roleUsers.filter((user) => studentClassFilter ? String(user?.class_name || '').trim().toLowerCase() === String(studentClassFilter).trim().toLowerCase() : true).map((user) => String(user?.section || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const getUserRecordId = (user) => user?.id ?? user?.ID ?? user?.Id ?? user?.user_id ?? user?.userId ?? user?.staff_id ?? user?.management_id ?? null;
  const isUserDisabled = (user) => Number(user?.is_disabled || user?.disabled || 0) === 1 || String(user?.status || '').trim().toLowerCase() === 'disabled';

  const deleteUser = async (user) => {
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    const userId = getUserRecordId(user);
    if (!schoolCode || !userId) return;
    try { setRoleLoading(true); setActionUser(null); await axios.delete(`https://cleezoclass.com:4000/api/users/${userId}`, { params: { schoolCode }, data: { schoolCode } }); await reloadRoleUsers(); alert('Deleted permanently'); } 
    catch (error) { alert('Delete failed'); } 
    finally { setRoleLoading(false); }
  };

  const toggleUserDisabled = async (user) => {
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    const userId = getUserRecordId(user);
    if (!schoolCode || !userId) return;
    const disabled = !isUserDisabled(user);
    try { setRoleLoading(true); setActionUser(null); await axios.patch(`https://cleezoclass.com:4000/api/users/${userId}/disabled`, { schoolCode, disabled }, { params: { schoolCode } }); await reloadRoleUsers(); alert(disabled ? 'User disabled.' : 'User enabled.'); } 
    catch (error) { alert('Action failed'); } 
    finally { setRoleLoading(false); }
  };

  useEffect(() => {
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    if (!schoolCode) return;
    axios.get(`https://cleezoclass.com:4000/track-records/${schoolCode}`).then((res) => { if (res.data.success) setTrackingStats(res.data.stats); }).catch((err) => console.error(err.message));
  }, [uploadedData, formData.school_code]);

  const isStepComplete = (stepTitle) => {
    switch (stepTitle) {
      case 'Details': return !!(formData.school_name && formData.address);
      case 'Management': return trackingStats.management > 0 || !!formData.school_code;
      case 'Staff': return trackingStats.teacher > 0;
      case 'Students': return trackingStats.student > 0;
      default: return false;
    }
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate('/', { replace: true }); };

  const addUserTypeLabel = addUserForm.user_type === 'management' ? 'Management' : addUserForm.user_type === 'teacher' ? 'Teacher' : 'Student';
  const addUserSubmitLabel = `Add ${addUserTypeLabel.toLowerCase()}`;
  const isAddStudent = addUserForm.user_type === 'student';
  const isAddTeacher = addUserForm.user_type === 'teacher';
  const isAddManagement = addUserForm.user_type === 'management';
const totalPages = Math.ceil(filteredRoleUsers.length / recordsPerPage);

const paginatedRoleUsers = filteredRoleUsers.slice(
  (currentPage - 1) * recordsPerPage,
  currentPage * recordsPerPage
);
  return (
    <div style={styles.container}>
      {/* <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
          <div style={styles.logoBox} onClick={() => clickHiddenInput('file-authorized_logo')}>
            {formData.authorized_logo ? <img src={formData.authorized_logo instanceof File ? URL.createObjectURL(formData.authorized_logo) : formData.authorized_logo} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <>School Logo</>}
            <input id="file-authorized_logo" type="file" accept="image/*" onChange={(e) => handlePhotoChange(e, 'authorized_logo')} style={{ display: 'none' }} />
          </div>
          <div style={styles.schoolNameBox}>{formData.school_name || 'School Name'}</div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div> */}

      <div style={styles.navBar}>
       {([
        // 'Details',
         'Management', 'Staff', 'Student'].map((tab) => (
          <div key={tab} style={{ ...styles.navTab, ...(activeTab === tab ? styles.activeTab : {}) }} onClick={() => setActiveTab(tab)}>{tab}</div>
        )))}
      </div>

      <div style={activeTab === 'Uploads' ? styles.uploadsMainContent : styles.mainContent}>
        

        {activeRoleTab && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px',  padding: '20px 24px',  width: '100%' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{roleTabConfig[activeRoleTab].title}</h1>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Manage, upload, and add {activeRoleTab.toLowerCase()} records efficiently.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }} onClick={() => openAddUserModal(roleTabConfig[activeRoleTab].userType)}>
                  + Add Single {activeRoleTab === 'Staff' ? 'Teacher' : activeRoleTab}
                </button>
                <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#000000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)' }} onClick={openUploadPopup}>
                  Upload {activeRoleTab} Data
                </button>
              </div>
            </div>
     {/* <div style={styles.progressFooter}>
        <div style={styles.trackerRow}>
          {([ { title: 'Details', sub: 'Details Submitted' }, { title: 'Management', sub: 'Logins Created' }, { title: 'Staff', sub: 'Staff Created' }, { title: 'Students', sub: 'Students Created' } ].map((step, i, arr) => {
            const isDone = isStepComplete(step.title);
            const color = isDone ? ['#3182ce', '#c05621', '#ecc94b', '#3182ce', '#48bb78'][i] : '#cfcfcf';
            return (
              <React.Fragment key={i}>
                <div style={{ textAlign: 'center', minWidth: '110px' }}><div style={{ ...styles.stepCircle, borderColor: color, color: color, backgroundColor: isDone ? `${color}15` : '#fff', borderStyle: isDone ? 'solid' : 'dashed', fontWeight: 'bold' }}>{i + 1}</div><div style={{ ...styles.stepLabel, color: isDone ? '#333' : '#999' }}><strong>{step.title}</strong></div><div style={styles.subLabel}>{step.sub}</div></div>
                {i !== arr.length - 1 && (<div style={styles.connectorWrapper}><div style={{ ...styles.connectorLine, backgroundColor: isDone ? color : '#cfcfcf' }} /><div style={{ ...styles.connectorArrow, borderLeftColor: isDone ? color : '#cfcfcf' }} /></div>)}
              </React.Fragment>
            );
          }))}
        </div>
      </div> */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Existing {activeRoleTab} ({filteredRoleUsers.length})</h2>
              </div>

              {activeRoleTab === 'Student' && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div style={{ flex: '1 1 200px' }}><label style={{ fontSize: '12px', color: '#475569', marginBottom: '4px', display: 'block' }}>Class</label><select value={studentClassFilter} onChange={(e) => { setStudentClassFilter(e.target.value); setStudentSectionFilter(''); }} style={{ ...styles.input, padding: '8px' }}><option value="">All Classes</option>{studentClassOptions.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div style={{ flex: '1 1 200px' }}><label style={{ fontSize: '12px', color: '#475569', marginBottom: '4px', display: 'block' }}>Section</label><select value={studentSectionFilter} onChange={(e) => setStudentSectionFilter(e.target.value)} style={{ ...styles.input, padding: '8px' }}><option value="">All Sections</option>{studentSectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div style={{ flex: '1 1 200px' }}><label style={{ fontSize: '12px', color: '#475569', marginBottom: '4px', display: 'block' }}>Name</label><input value={studentNameFilter} onChange={(e) => setStudentNameFilter(e.target.value)} placeholder="Search name" style={{ ...styles.input, padding: '8px' }} /></div>
                </div>
              )}

              {roleLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
              ) : paginatedRoleUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', border: '2px dashed #cbd5e1', borderRadius: '8px' }}><p style={{ fontSize: '16px', margin: 0 }}>No {activeRoleTab.toLowerCase()} records found.</p></div>
              ) : (
<div
ref={tableContainerRef} style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
    <thead>
      <tr>
        {/* 👇 Added sticky styles to Photo header */}
        <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
          Photo
        </th>
        
        {roleTabConfig[activeRoleTab].columns.map((col) => (
          // 👇 Added sticky styles to dynamic headers
          <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
            {col.label}
          </th>
        ))}
        
        {/* 👇 Added sticky styles to WhatsApp & Actions headers */}
        <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>WhatsApp</th>
        <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Actions</th>
      </tr>
    </thead>
    
    <tbody>
      {paginatedRoleUsers.map((user, index) => {
        const userId = getUserRecordId(user) ?? `${user.username || user.name}-${index}`;
        const disabled = isUserDisabled(user);
        
        return (
          <tr key={userId} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc', opacity: disabled ? 0.6 : 1 }}>
            
            <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
              {user.photo ? (
                <img 
                  src={user.photo} 
                  alt={user.name || 'User'} 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc'
                  }} 
                />
              ) : (
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: '#f1f5f9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#94a3b8', 
                  fontSize: '10px', 
                  margin: '0 auto',
                  border: '1px solid #e2e8f0'
                }}>
                  No Img
                </div>
              )}
            </td>

            {roleTabConfig[activeRoleTab].columns.map((col) => {
              const value = col.key === 'phone' ? (user.phone_no || user.father_phone_no || user.phone || '-') : (user[col.key] || '-');
              return (
                <td key={col.key} style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155', whiteSpace: 'nowrap' }}>
                  {value}
                </td>
              );
            })}
            
            <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
              {(user.phone_no || user.father_phone_no || user.phone) ? (
                <button 
                  onClick={() => { 
                    const phone = user.phone_no || user.father_phone_no || user.phone; 
                    const cleanedPhone = String(phone).replace(/\D/g, ''); 
                    const formattedPhone = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`; 
                    window.open(`https://web.whatsapp.com/send?phone=${formattedPhone}`, '_blank'); 
                  }} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%' }} 
                  title="Send WhatsApp"
                >
                  <FaWhatsapp size={22} color="#25D366" />
                </button>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>N/A</span>
              )}
            </td>
            
            <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button onClick={(e) => { e.stopPropagation(); openEditUserModal(user); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6' }} title="Edit">
                  <Pencil size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setActionUser(user); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Actions">
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>

  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "0 10px" }}>
    <span style={{ color: "#64748b", fontSize: "14px" }}>
      Showing {Math.min((currentPage - 1) * recordsPerPage + 1, filteredRoleUsers.length)} - {Math.min(currentPage * recordsPerPage, filteredRoleUsers.length)} of {filteredRoleUsers.length}
    </span>

    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {/* 👇 UPDATED PREVIOUS BUTTON */}
      <button 
        disabled={currentPage === 1} 
        onClick={() => handlePageChange(currentPage - 1)} 
        style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", background: currentPage === 1 ? "#f1f5f9" : "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
      >
        Previous
      </button>

      {/* 👇 UPDATED PAGE NUMBER BUTTONS */}
      {Array.from({ length: totalPages }, (_, i) => (
        <button 
          key={i} 
          onClick={() => handlePageChange(i + 1)} 
          style={{ width: "36px", height: "36px", borderRadius: "6px", border: "1px solid #cbd5e1", background: currentPage === i + 1 ? "#2563eb" : "#fff", color: currentPage === i + 1 ? "#fff" : "#000", cursor: "pointer", fontWeight: 600 }}
        >
          {i + 1}
        </button>
      ))}

      {/* 👇 UPDATED NEXT BUTTON */}
      <button 
        disabled={currentPage === totalPages} 
        onClick={() => handlePageChange(currentPage + 1)} 
        style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", background: currentPage === totalPages ? "#f1f5f9" : "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
      >
        Next
      </button>
    </div>
  </div>
</div>
              )}
            </div>
          </>
        )}

        {showUploadPopup && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>Upload {activeRoleTab} Data</h2>
                <button onClick={closeUploadPopup} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
                <div style={{  borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                  {/* <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#b91c1c', fontSize: '14px' }}>⚠️ Mandatory fields:</p>
                  <p style={{ margin: 0, color: '#b91c1c', fontSize: '13px' }}>{activeRoleTab === 'Student' ? 'Name, Mobile number, Class, Section, Father Name' : activeRoleTab === 'Staff' ? 'Name, Mobile number, Designation, Classes Assigned' : 'Name, Mobile number, Designation'}</p>
                  <p style={{ margin: '12px 0 0', fontWeight: '600', color: '#b91c1c', fontSize: '14px' }}>🔴 Upload data in this Order format only:</p>
                  <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }}>
                      <thead><tr>{getExcelTemplateHeaders(activeRoleTab).map((header, index) => (<td key={index} style={{ border: '1px solid #fecaca', padding: '6px 10px', textAlign: 'center', color: '#b91c1c', fontWeight: 'bold', whiteSpace: 'nowrap', backgroundColor: '#fff' }}>{header}</td>))}</tr></thead>
                    </table>
                  </div> */}
                  <button type="button" onClick={() => downloadExcelTemplate(roleTabConfig[activeRoleTab].templateCategory)} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#fff', color: '#b91c1c', border: '1px solid #b91c1c', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Download Template</button>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155', fontSize: '14px' }}>Choose Excel File (.xls, .xlsx)</label>
                  <input type="file" accept=".xls,.xlsx" onChange={(e) => { const file = e.target.files?.[0] ?? null; setExcelFile(file); if (file) { setPreviewData([]); setUploadedData([]); handlePreview(file, getUploadPreviewCategory(activeRoleTab)); } }} style={{ display: 'block', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#334155', backgroundColor: '#f8fafc' }} />
                  {excelFile && <p style={{ color: '#3b82f6', marginTop: '8px', fontSize: '13px', fontWeight: '500' }}>Selected: {excelFile.name}</p>}
                </div>

                {previewData.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Preview Data ({previewData.length} records)</h3>
                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead><tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>{Object.keys(previewData[0]).map((key) => (<th key={key} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{formatExcelColumnLabel(key)}</th>))}</tr></thead>
                        <tbody>{previewData.map((item, index) => (<tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>{Object.keys(previewData[0]).map((key) => (<td key={key} style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#334155', whiteSpace: 'nowrap' }}>{formatExcelCellValue(item[key])}</td>))}</tr>))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '0 0 12px 12px' }}>
                <div>{uploadedData.length > 0 && (<button type="button" onClick={downloadExcel} style={{ padding: '10px 20px', backgroundColor: '#f9b1b8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> Download Uploaded Data</button>)}</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={closeUploadPopup} style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Cancel</button>
                  {previewData.length > 0 && uploadedData.length === 0 && (<button type="button" onClick={() => handleFileUpload(roleTabConfig[activeRoleTab].templateCategory)} disabled={uploading} style={{ padding: '10px 20px', backgroundColor: uploading ? '#94a3b8' : '#000000', color: '#fff', border: 'none', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>{uploading ? <><Circle size={16} className="spin" /> Uploading...</> : <><CheckCircle size={16} /> Confirm & Upload</>}</button>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Details' && (
          <>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "25px",
    alignItems: "start",
    marginTop: "20px",
  }}
>
  <div>
    <div style={styles.row}>
      <div style={{ ...styles.inputGroup, flex: 1, marginRight: "15px" }}>
        <label style={styles.label}>School Name</label>
        <input
          name="school_name"
          value={formData.school_name}
          onChange={handleChange}
          placeholder="Enter School Name"
          style={styles.input}
        />
      </div>

      <div style={{ ...styles.inputGroup, flex: 1 }}>
        <label style={styles.label}>Curriculum</label>
        <select
          name="curriculum"
          value={formData.curriculum}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Select Curriculum</option>
          <option>CBSE</option>
          <option>ICSE</option>
        </select>
      </div>
    </div>

    <div style={styles.inputGroup}>
      <label style={styles.label}>Address</label>
      <input
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Enter Address"
        style={styles.input}
      />
    </div>

    <div style={styles.row}>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Authorized Person</label>
        <input
          name="institute_authorized_person"
          value={formData.institute_authorized_person}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Email</label>
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Email App Key</label>
        <input
          name="email_app_key"
          value={formData.email_app_key}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
    </div>

    <div style={styles.row}>
      <div style={styles.inputGroup}>
        <label style={styles.label}>City</label>
        <input
          name="city"
          value={formData.city}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>State</label>
        <select
          name="state"
          value={formData.state}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Select State</option>
          <option>Telangana</option>
          <option>Andhra Pradesh</option>
        </select>
      </div>
    </div>

    <div style={styles.inputGroup}>
      <label style={styles.label}>Pincode</label>
      <input
        name="pincode"
        value={formData.pincode}
        onChange={handleChange}
        style={styles.input}
      />
    </div>
  </div>


  <div
    style={{
      borderLeft: "2px solid #ddd",
      paddingLeft: "20px",
    }}
  >
    <div style={styles.row}>
      <div style={styles.inputGroup}>
        <label style={styles.label}>School Code</label>
        <input
          name="school_code"
          value={formData.school_code}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Registration No</label>
        <input
          name="registration_no"
          value={formData.registration_no}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
    </div>

    <div style={styles.row}>
      <input
        name="school_strength"
        value={formData.school_strength}
        onChange={handleChange}
        placeholder="No. of Students"
        style={styles.input}
      />

      <input
        name="staff_strength"
        value={formData.staff_strength}
        onChange={handleChange}
        placeholder="No. of Staff"
        style={styles.input}
      />
    </div>

    <div style={styles.row}>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Departments</label>
        <select style={styles.input}>
          <option>Select Department</option>
          <option>Store / Library</option>
        </select>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Activities</label>
        <select style={styles.input}>
          <option>Select Activity</option>
          <option>Karate</option>
          <option>Skating</option>
        </select>
      </div>
    </div>

    <div style={styles.inputGroup}>
      <label style={styles.label}>Branches</label>
      <input
        name="tagline"
        value={formData.tagline}
        onChange={handleChange}
        style={styles.input}
      />
    </div>

    <button
      style={{
        ...styles.nextBtn,
        marginTop: "15px",
      }}
    >
      Next →
    </button>
  </div>


  <div
    style={{
      borderLeft: "2px solid #ddd",
      paddingLeft: "20px",
    }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap: "20px",
      }}
    >
      {photoFields.map((photo) => {
        const photoValue = formData[photo.key];

        return (
          <div key={photo.key} style={{ textAlign: "center" }}>
            <label style={styles.label}>{photo.label}</label>

            <div
              style={styles.photoBox}
              onClick={() => clickHiddenInput(`file-${photo.key}`)}
            >
              {photoValue ? (
                <img
                  src={
                    photoValue instanceof File
                      ? URL.createObjectURL(photoValue)
                      : photoValue
                  }
                  alt={photo.label}
                  style={styles.previewImage}
                />
              ) : (
                <img
                  src={cameraIcon}
                  alt=""
                  style={styles.iconStyle}
                />
              )}
            </div>

            <input
              id={`file-${photo.key}`}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handlePhotoChange(e, photo.key)}
            />
          </div>
        );
      })}
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "25px",
      }}
    >
      <div
        style={{
          ...styles.photoBox,
          width: "100px",
          height: "100px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src={applicationIcon}
          alt="Update"
          onClick={handleUpdate}
          style={{
            width: "70%",
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  </div>
</div>
          </>
        )}


        {activeTab === 'Uploads' && (
          <>
            <div style={styles.uploadSection}><h3 style={styles.sectionHeading}>Time Table</h3><div style={styles.inputGrid}><div style={styles.inputGroup}><label style={styles.label}>Class</label><select style={styles.input}><option>Select</option></select></div><div style={styles.inputGroup}><label style={styles.label}>Section</label><select style={styles.input}><option>Select</option></select></div><div style={styles.inputGroup}><label style={styles.label}>Teacher</label><select style={styles.input}><option>Select</option></select></div><div style={styles.inputGroup}><label style={styles.label}>Day</label><select style={styles.input}><option>Select</option></select></div></div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '15px' }}><button style={styles.actionBtn}>Upload Time Table</button><span style={{ margin: '0 10px', color: '#666' }}>(or)</span><button style={styles.actionBtn}>Generate New</button></div></div>
            <div style={{ ...styles.uploadSection, borderLeft: '2px solid #ddd', borderRight: '2px solid #ddd' }}><h3 style={styles.sectionHeading}>School Calendar</h3><div style={styles.inputGrid}><div style={styles.inputGroup}><label style={styles.label}>First Day *</label><input type="date" style={styles.input} /></div><div style={styles.inputGroup}><label style={styles.label}>Last Day *</label><input type="date" style={styles.input} /></div><div style={styles.inputGroup}><label style={styles.label}>Annual Day</label><input type="date" style={styles.input} /></div><div style={styles.inputGroup}><label style={styles.label}>Freshers Day</label><input type="date" style={styles.input} /></div></div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '15px' }}><button style={styles.actionBtn}>Upload Calendar</button><span style={{ margin: '0 10px', color: '#666' }}>(or)</span><button style={styles.actionBtn}>Generate New</button></div></div>
            <div style={styles.uploadSection}><h3 style={styles.sectionHeading}>School Radius Setup</h3><div style={styles.inputGrid}><div style={styles.inputGroup}><label style={styles.label}>Branch *</label><input name="school_name" value={formData.school_name} onChange={handleChange} placeholder="Enter School Name" style={styles.input} /></div><div style={styles.inputGroup}><label style={styles.label}>Address</label><input name="address" value={formData.address} onChange={handleChange} placeholder="Enter Address" style={styles.input} /></div><div style={styles.inputGroup}><label style={styles.label}>Latitude *</label><input name="latitude" placeholder="Lat" value={formData.latitude} onChange={handleChange} style={styles.input} /></div><div style={styles.inputGroup}><label style={styles.label}>Longitude *</label><input name="longitude" placeholder="Long" value={formData.longitude} onChange={handleChange} style={styles.input} /></div><div style={styles.inputGroup}><label style={styles.label}>Radius (meters)</label><input name="radius" placeholder="Enter Radius" value={formData.radius} onChange={handleChange} style={styles.input} /></div><div style={styles.inputGroup}><label style={styles.label}>Use Radius</label><input type="text" name="use_radius" placeholder="Enter Use Radius" value={formData.use_radius} onChange={handleChange} style={styles.input} /></div></div><button style={{ ...styles.actionBtn, width: '100%', marginTop: '30px' }} onClick={handleUpdate}>Submit</button></div>
          </>
        )}
      </div>

      {isAddUserOpen && userModalMode === 'edit' && (<StudentEditingPopup 
      isOpen={isAddUserOpen}
      editingId={editingUserId} 
      userType={addUserForm.user_type} 
      formData={addUserForm} 
      onFieldChange={(field, value) => setAddUserForm((prev) => ({ ...prev, [field]: value }))} 
      onClassChange={(className) => setAddUserForm((prev) => ({ ...prev, class_name: className, section: '' }))} 
      classOptions={studentClassOptions} 
      getSectionsForClass={getStudentSectionsForClass} 
      photoPreview={studentPhotoPreview} 
      photoFile={studentPhotoFile} 
      onPhotoChange={(e) => { const file = e.target.files?.[0] ?? null; if (file) { setStudentPhotoFile(file); setStudentPhotoPreview(URL.createObjectURL(file)); } }} 
      onRemovePhoto={() => { setStudentPhotoFile(null); setStudentPhotoPreview(normalizePhotoUrl(addUserForm.photo)); }} 
      onCancel={closeAddUserModal} 
      onSubmit={handleAddUserSubmit} 
      isLoading={isAddUserSubmitting} />)}
      
      {isAddUserOpen && userModalMode === 'add' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}><div><h3 style={styles.modalTitle}>{`Add ${addUserTypeLabel}`}</h3><p style={styles.modalSubtitle}>{`Create a new ${addUserForm.user_type} account for this school.`}</p></div><button type="button" onClick={closeAddUserModal} style={styles.modalCloseBtn}>×</button></div>
            {createdCredentials && 
            (<div style={styles.credentialsCard}>
              <div style={styles.credentialsHeader}><div style={styles.credentialsHeaderLeft}>
              <div style={styles.credentialsIconWrap}>✓</div>
              <div><div style={styles.credentialsTitle}>User created successfully</div>
              <div style={styles.credentialsSubtitle}>Copy these login details before closing.</div></div></div>
              <span style={styles.credentialsBadge}>{createdCredentials.user_type}</span>
              </div><div style={styles.credentialsGrid}><div style={styles.credentialsBlock}>
                <div style={styles.credentialsLabel}>Name</div>
                <div style={styles.credentialsValue}>{createdCredentials.name || '-'}</div>
              </div><div style={styles.credentialsBlock}>
                <div style={styles.credentialsLabel}>Username</div>
                <div style={styles.credentialsValueRow}>
                  <span style={styles.credentialsMono}>{createdCredentials.username || '-'}</span>
                  <button type="button" style={styles.copyMiniBtn} onClick={() => copyCredentials(createdCredentials.username || '')}>Copy</button>
                  </div>
                  </div>
                <div style={styles.credentialsBlock}>
              <div style={styles.credentialsLabel}>Password</div>
              <div style={styles.credentialsValueRow}><span style={styles.credentialsMono}>{createdCredentials.password || '-'}</span>
              <button type="button" style={styles.copyMiniBtn} onClick={() => copyCredentials(createdCredentials.password || '')}>Copy</button>
              </div>
              </div>
              </div>
              </div>)}
            <form onSubmit={handleAddUserSubmit} style={styles.modalForm}>
              <div style={styles.modalSection}><h4 style={styles.modalSectionTitle}>Personal Information</h4><div style={{ ...styles.modalGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}><div style={styles.inputGroup}><label style={styles.label}>Full Name *</label><input name="name" value={addUserForm.name} onChange={handleAddUserChange} style={{ ...styles.input, textTransform: 'uppercase' }} placeholder="Enter full name" /></div><div style={styles.inputGroup}><label style={styles.label}>Gender</label><select name="gender" value={addUserForm.gender} onChange={handleAddUserChange} style={styles.input}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div><div style={styles.inputGroup}><label style={styles.label}>Date of Birth</label><input type="date" name="dob" value={addUserForm.dob} onChange={handleAddUserChange} style={styles.input} /></div></div></div>
              <div style={styles.modalSection}><h4 style={styles.modalSectionTitle}>Contact Information</h4><div style={{ ...styles.modalGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}><div style={styles.inputGroup}><label style={styles.label}>{isAddStudent ? "Father's Phone Number" : 'Phone Number'}</label><input name={isAddStudent ? 'father_phone_no' : 'phone_no'} value={isAddStudent ? addUserForm.father_phone_no : addUserForm.phone_no} onChange={handleAddUserChange} style={styles.input} placeholder="Enter phone number" /></div><div style={styles.inputGroup}><label style={styles.label}>Aadhar Number</label><input name="aadhar_no" value={addUserForm.aadhar_no} onChange={handleAddUserChange} style={styles.input} placeholder="Enter Aadhar number" /></div><div style={styles.inputGroup}><label style={styles.label}>Father Name</label><input name="father_name" value={addUserForm.father_name} onChange={handleAddUserChange} style={styles.input} placeholder="Enter father name" /></div><div style={styles.inputGroup}><label style={styles.label}>School Name</label><input name="school_name" value={addUserForm.school_name} onChange={handleAddUserChange} style={styles.input} placeholder="School name" /></div><div style={styles.inputGroup}><label style={styles.label}>Address</label><textarea name="address" value={addUserForm.address} onChange={handleAddUserChange} style={{ ...styles.input, minHeight: '84px', resize: 'vertical' }} placeholder="Enter address" /></div></div></div>
              {isAddStudent && (<><div style={styles.modalSection}><h4 style={styles.modalSectionTitle}>Student Details</h4><div style={{ ...styles.modalGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}><div style={styles.inputGroup}><label style={styles.label}>Class*</label><select name="class_name" value={addUserForm.class_name} onChange={(e) => setAddUserForm((prev) => ({ ...prev, class_name: e.target.value, section: '' }))} style={styles.input}><option value="">-- Select Class --</option>{studentClassOptions.map((className) => (<option key={className} value={className}>{className}</option>))}</select></div><div style={styles.inputGroup}><label style={styles.label}>Section</label><select name="section" value={addUserForm.section} onChange={handleAddUserChange} style={styles.input} disabled={!addUserForm.class_name}><option value="">-- Select Section --</option>{getStudentSectionsForClass(addUserForm.class_name).map((sec) => (<option key={sec} value={sec}>{sec}</option>))}</select></div><div style={styles.inputGroup}><label style={styles.label}>Class Teacher</label><input type="text" name="class_teacher" value={addUserForm.class_teacher} onChange={handleAddUserChange} style={styles.input} /></div></div></div></>)}
              {(isAddTeacher || isAddManagement) && (<div style={styles.modalSection}><h4 style={styles.modalSectionTitle}>Designation</h4><div style={{ ...styles.modalGrid, gridTemplateColumns: '1fr' }}><div style={styles.inputGroup}><label style={styles.label}>Designation</label>{isAddManagement ? (<select name="designation" value={addUserForm.designation} onChange={handleAddUserChange} style={styles.input}><option value="">Select designation</option>{managementDesignationOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}</select>) : (<input type="text" name="designation" value={addUserForm.designation || ''} onChange={handleAddUserChange} style={styles.input} placeholder="Enter designation" />)}</div></div></div>)}
              <div style={styles.modalActions}><button type="button" onClick={closeAddUserModal} style={styles.cancelActionBtn}>Cancel</button><button type="submit" style={styles.primaryActionBtn} disabled={isAddUserSubmitting}>{isAddUserSubmitting ? 'Saving...' : addUserSubmitLabel}</button></div>
            </form>
          </div>
        </div>
      )}

      {actionUser && (
        <div style={styles.accountActionOverlay} onClick={() => setActionUser(null)}>
          <div style={styles.accountActionCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.accountActionTitle}>Account actions</h3>
            <p style={styles.accountActionText}>Choose an action for <strong>{actionUser?.name || 'this user'}</strong>.</p>
            <button type="button" style={styles.accountActionButton} onClick={() => toggleUserDisabled(actionUser)}>{isUserDisabled(actionUser) ? 'Enable login' : 'Disable login'}</button>
            <button type="button" style={{ ...styles.accountActionButton, ...styles.accountActionDangerButton }} onClick={() => deleteUser(actionUser)}>Delete permanently</button>
            <button type="button" style={styles.accountActionCancelButton} onClick={() => setActionUser(null)}>Cancel</button>
          </div>
        </div>
      )}
      {
        roleLoading && <GlobalLoader/>
      }
    </div>
  );
};


const styles = {
  container: { fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5",  padding: "10px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#fff" },
  logoBox: { border: "1px dashed #999", width: "100px", height: "60px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px", cursor: "pointer", overflow: "hidden", backgroundColor: "#fff" },
  schoolNameBox: { fontWeight: "bold", textAlign: "center", flex: 1 },
  logoutBtn: { backgroundColor: "#a0a0a0", color: "white", border: "none", padding: "8px 20px", borderRadius: "20px", cursor: "pointer" },
  navBar: { display: "flex", overflowX: "auto",color:"black", padding: "0 10px", position: "sticky", top: 16, zIndex: 1000,
  background: "rgba(255, 255, 255, 0.45)",},
  navTab: { padding: "12px 20px", color: "black", cursor: "pointer", whiteSpace: "nowrap" },
  activeTab: { borderBottom: "3px solid #f9b1b8", color: "black" },
  mainContent: { display: "flex", flexDirection: "column",padding: "20px",backgroundColor: "#f5f5f5", borderRadius: "8px", alignItems: "center" },
  uploadsMainContent: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", padding: "20px", margin: "10px" },
  row: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" },
  inputGroup: { display: "flex", flexDirection: "column", flex: "1 1 210px", marginBottom: "10px" },
  label: { fontSize: "12px", color: "#475569", marginBottom: "6px", fontWeight: 600, textAlign: "center" },
  input: { padding: "10px 12px", borderRadius: "8px", border: "1px solid #cfd8e3", width: "100%", fontSize: "15px", backgroundColor: "#fff" },
  nextBtn: { backgroundColor: "#333", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer" },
  photoBox: { border: "2px solid #ff4d6d", borderRadius: "12px", height: "80px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0", cursor: "pointer", overflow: "hidden" },
  previewImage: { width: "100%", height: "100%", objectFit: "cover" },
  iconStyle: { width: "30px", opacity: 0.4 },
  updateIconStyle: { width: "50px", cursor: "pointer" },
  uploadSection: { padding: "10px" },
  sectionHeading: { fontSize: "16px", color: "#666", textAlign: "center", marginBottom: "15px" },
  inputGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" },
  actionBtn: { backgroundColor: "#444", color: "white", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", width: "100%" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", zIndex: 1000 },
  modalCard: { backgroundColor: "#fff", padding: "28px", borderRadius: "18px", width: "90%", maxHeight: "90vh", overflowY: "auto", maxWidth: "980px", position: "relative", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.28)" },
  modalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "20px" },
  modalTitle: { margin: 0, fontSize: "28px", fontWeight: 700, color: "#0f172a", paddingBottom: "8px" },
  modalSubtitle: { margin: "8px 0 0", color: "#64748b", fontSize: "14px" },
  modalCloseBtn: { border: "none", background: "transparent", fontSize: "28px", lineHeight: 1, cursor: "pointer", color: "#334155" },
  modalForm: { display: "flex", flexDirection: "column", gap: "16px" },
  credentialsCard: { marginBottom: "18px", border: "1px solid rgba(134, 239, 172, 0.65)", background: "linear-gradient(135deg, rgba(240, 253, 244, 0.98) 0%, rgba(220, 252, 231, 0.92) 100%)", borderRadius: "18px", padding: "18px", boxShadow: "0 12px 30px rgba(22, 101, 52, 0.12)" },
  credentialsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px", color: "#166534" },
  credentialsHeaderLeft: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
  credentialsIconWrap: { width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#166534", color: "#fff", fontWeight: 800, boxShadow: "0 8px 18px rgba(22, 101, 52, 0.22)", flexShrink: 0 },
  credentialsTitle: { fontSize: "16px", fontWeight: 800, color: "#14532d", lineHeight: 1.2 },
  credentialsSubtitle: { marginTop: "2px", fontSize: "12px", color: "#4b5563" },
  credentialsBadge: { backgroundColor: "#dcfce7", color: "#166534", borderRadius: "999px", padding: "4px 10px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" },
  credentialsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" },
  credentialsBlock: { backgroundColor: "rgba(255, 255, 255, 0.72)", border: "1px solid rgba(134, 239, 172, 0.45)", borderRadius: "14px", padding: "12px 14px", backdropFilter: "blur(4px)" },
  credentialsLabel: { fontSize: "12px", color: "#4b5563", marginBottom: "4px" },
  credentialsValue: { fontSize: "14px", fontWeight: 700, color: "#0f172a", wordBreak: "break-word" },
  credentialsValueRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", fontSize: "14px", fontWeight: 700, color: "#0f172a", wordBreak: "break-word" },
  credentialsMono: { fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, Liberation Mono, monospace", fontSize: "13px", color: "#0f172a", wordBreak: "break-all" },
  copyMiniBtn: { border: "none", backgroundColor: "#14532d", color: "#fff", borderRadius: "999px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 700, flexShrink: 0, boxShadow: "0 6px 14px rgba(20, 83, 45, 0.18)" },
  modalGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" },
  modalSection: { backgroundColor: "#f8fafc", padding: "18px", borderRadius: "16px", border: "1px solid #dbe4f0", boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)" },
  modalSectionTitle: { color: "#1f2937", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #dbe4f0", fontSize: "16px", fontWeight: 700, textAlign: "center" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", flexWrap: "wrap" },
  cancelActionBtn: { border: "none", backgroundColor: "#6c757d", color: "#fff", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontWeight: 500 },
  primaryActionBtn: { border: "none", backgroundColor: "#f9b1b8", color: "#fff", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: 700 },
  progressFooter: { padding: "10px" },
  trackerRow: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" },
  stepCircle: { width: "60px", height: "60px", borderRadius: "50%", border: "2px dashed #ccc", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px" },
  stepLabel: { fontSize: "11px", textAlign: "center" },
  subLabel: { fontSize: "10px", color: "#888", textAlign: "center" },
  connectorWrapper: { display: "flex", alignItems: "center", position: "relative", width: "60px", justifyContent: "center" },
  connectorLine: { height: "2px", width: "100%", backgroundColor: "#ccc" },
  connectorArrow: { width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "8px solid #ccc", position: "absolute", right: "-4px" },
  accountActionOverlay: { position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backgroundColor: "rgba(15, 23, 42, 0.58)" },
  accountActionCard: { width: "100%", maxWidth: "420px", padding: "26px", borderRadius: "18px", backgroundColor: "#fff", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.3)" },
  accountActionTitle: { margin: "0 0 8px", color: "#111827", fontSize: "22px" },
  accountActionText: { margin: "0 0 20px", color: "#4b5563", lineHeight: 1.5 },
  accountActionButton: { width: "100%", marginBottom: "10px", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: "10px", backgroundColor: "#f9fafb", color: "#111827", cursor: "pointer", fontSize: "14px", fontWeight: 700 },
  accountActionDangerButton: { borderColor: "#fca5a5", backgroundColor: "#fff5f5", color: "#dc2626" },
  accountActionCancelButton: { width: "100%", padding: "11px 16px", border: "none", borderRadius: "10px", backgroundColor: "transparent", color: "#6b7280", cursor: "pointer", fontSize: "14px" }
};

export default TeacherUpload;