import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Ban, Unlock } from 'lucide-react';
import StudentEditingPopup from './StudentEditingPopup.jsx';
import { IoClose } from 'react-icons/io5';
import applicationIcon from '../assets/application.png';

type UploadAsset = File | string | null;
type TabName = 'Details' | 'Management' | 'Staff' | 'Student' | 'Uploads';
type StepTitle = 'Details' | 'Management' | 'Staff' | 'Students' | 'Uploaded Files';
type UserType = 'student' | 'teacher' | 'management';
type RoleTab = 'Management' | 'Staff' | 'Student';
type UploadPreviewCategory = 'Student' | 'Staff' | 'Management';
type FileFieldKey =
  | 'authorized_logo'
  | 'school_photo'
  | 'correspondent'
  | 'front_office'
  | 'other_photo';
type FormFieldKey = Exclude<keyof FormDataState, FileFieldKey>;
type DetailsFormErrors = Partial<Record<keyof FormDataState, string>>;

interface FormDataState {
  school_name: string;
  curriculum: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  school_code: string;
  school_strength: string;
  staff_strength: string;
  tagline: string;
  registration_no: string;
  authorized_logo: UploadAsset;
  school_photo: UploadAsset;
  correspondent: UploadAsset;
  front_office: UploadAsset;
  other_photo: UploadAsset;
  latitude: string;
  longitude: string;
  radius: string;
  use_radius: string;
  institute_authorized_person: string;
  email: string;
  email_app_key: string;
  institute_contact_number: string;
}

interface SchoolApiResponse {
  institute_name?: string;
  curriculum?: string;
  institute_address?: string;
  city_name?: string;
  state?: string;
  pincode?: string;
  school_code?: string;
  number_of_students?: string;
  number_of_staff?: string;
  tagline?: string;
  registration_no?: string;
  logo?: string | null;
  authorized_logo?: string | null;
  school_photo?: string | null;
  correspondent?: string | null;
  front_office?: string | null;
  other_photo?: string | null;
  latitude?: string;
  longitude?: string;
  radius?: string;
  use_radius?: string;
  institute_authorized_person?: string;
  email?: string;
  email_app_key?: string;
  institute_contact_number?: string;
}

interface UploadedRecord extends Record<string, unknown> {
  phone?: string;
  phone_no?: string;
  father_phone_no?: string;
}

interface UploadResponse {
  insertedRecords: UploadedRecord[];
  duplicates: UploadedRecord[];
  replacedRecords?: UploadedRecord[];
  skippedRows?: number;
  message?: string;
  rowErrors?: Array<{
    rowNumber: number;
    name?: string;
    designation?: string;
    message?: string;
  }>;
}

interface ExcelValidationError {
  rowNumber: number;
  columnNumber?: number;
  cellAddress?: string;
  field: string;
  message: string;
}

interface TrackingStats {
  teacher: number;
  student: number;
  management: number;
}

interface TrackingApiResponse {
  success: boolean;
  stats: TrackingStats;
}

interface AddUserFormState {
  user_type: UserType;
  name: string;
  username: string;
  password: string;
  gender: string;
  phone_no: string;
  father_phone_no: string;
  aadhar_no: string;
  father_name: string;
  class_name: string;
  section: string;
  class_teacher: string;
  school_name: string;
  address: string;
  dob: string;
  photo: string;
  admission_no: string;
  cbse_reg_no: string;
  curriculum: string;
  designation: string;
  teaches_to_1: string;
  teaches_to_2: string;
  teaches_to_3: string;
  teaches_to_4: string;
  teaches_to_5: string;
  teaches_to_6: string;
  teaches_to_7: string;
  teaches_to_8: string;
  teaches_to_9: string;
  teaches_to_10: string;
  teaches_to_11: string;
  teaches_to_12: string;
}

interface CreatedCredentials {
  name: string;
  username: string;
  password: string;
  user_type: UserType;
}

const createAddUserForm = (
  userType: UserType,
  defaults?: Partial<AddUserFormState>
): AddUserFormState => ({
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
  { label: 'Bus Driver', value: 'Bus Driver' },
] as const;

const managementDesignationLabels = managementDesignationOptions.map((o) => o.label);

const staffTemplateSampleRows = [
  {
    name: 'RAVI KUMAR',
    gender: 'Male',
    dob: '1990-05-15',
    phone_no: '9876543210',
    aadhar_no: '123456789012',
    father_name: 'SURESH KUMAR',
    address: 'Hyderabad',
    designation: 'Mathematics',
    teaches_to_1: 'Class 6',
    teaches_to_2: 'Class 7',
    teaches_to_3: 'Class 8',
    teaches_to_4: '',
    teaches_to_5: '',
    teaches_to_6: '',
    teaches_to_7: '',
    teaches_to_8: '',
    teaches_to_9: '',
    teaches_to_10: '',
    teaches_to_11: '',
    teaches_to_12: '',
  },
  {
    name: 'ANITA SHARMA',
    gender: 'Female',
    dob: '1988-11-20',
    phone_no: '9123456789',
    aadhar_no: '234567890123',
    father_name: 'MOHAN SHARMA',
    address: 'Vijayawada',
    designation: 'Science',
    teaches_to_1: 'Class 9',
    teaches_to_2: 'Class 10',
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
  },
] as const;

const initialFormData: FormDataState = {
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
  email_app_key: '',
  institute_contact_number: '',
};

const gmailRegex = /^[A-Z0-9._%+-]+@gmail\.com$/i;
const textRegex = /^[A-Za-z\s.'-]+$/;
const alphaNumericRegex = /^[A-Za-z0-9\s./#-]+$/;

const detailFieldLabels: Record<keyof FormDataState, string> = {
  school_name: 'School Name',
  curriculum: 'Curriculum',
  address: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  school_code: 'School Code',
  school_strength: 'No. of Students',
  staff_strength: 'No. of Staff',
  tagline: 'Branches',
  registration_no: 'School Reg. No.',
  authorized_logo: 'School Logo',
  school_photo: 'School Photo',
  correspondent: 'Correspondent',
  front_office: 'Header',
  other_photo: 'Footer',
  latitude: 'Latitude',
  longitude: 'Longitude',
  radius: 'Radius',
  use_radius: 'Use Radius',
  institute_authorized_person: 'Authorized Person',
  email: 'Email',
  email_app_key: 'Email App Key',
  institute_contact_number: 'Institute Contact Number',
};

const detailSanitizers: Partial<Record<FormFieldKey, (value: string) => string>> = {
  institute_authorized_person: (val) => val.replace(/[^A-Za-z\s.'-]/g, ''),
  city: (val) => val.replace(/[^A-Za-z\s.'-]/g, ''),
  pincode: (val) => val.replace(/\D/g, '').slice(0, 6),
  school_strength: (val) => val.replace(/\D/g, ''),
  staff_strength: (val) => val.replace(/\D/g, ''),
  registration_no: (val) => val.replace(/[^A-Za-z0-9\s./#-]/g, ''),
};

const photoFields: Array<{ key: FileFieldKey; label: string }> = [
  { key: 'school_photo', label: 'School Photo *' },
  { key: 'correspondent', label: 'Correspondent' },
  { key: 'front_office', label: ' Header' },
  { key: 'other_photo', label: 'Footer' },
];

const cameraIcon = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="10" y="18" width="44" height="30" rx="6" fill="#d9d9d9" stroke="#888" stroke-width="3"/><path d="M22 18l4-6h12l4 6" fill="#d9d9d9" stroke="#888" stroke-width="3"/><circle cx="32" cy="33" r="9" fill="#fff" stroke="#888" stroke-width="3"/></svg>'
)}`;

const clickHiddenInput = (id: string) => {
  document.getElementById(id)?.click();
};

const normalizePhotoUrl = (rawPhoto: any) => {
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
  return `https://cleezoclass.com:5000${photoPath}`;
};

const roleTabConfig: Record<
  RoleTab,
  {
    title: string;
    detailsTitle: string;
    addButtonLabel: string;
    userType: UserType;
    templateCategory: string;
    columns: Array<{ key: string; label: string }>;
  }
> = {
  Management: {
    title: 'Management Bulk Upload',
    detailsTitle: 'Management Details',
    addButtonLabel: 'Add Management',
    userType: 'management',
    templateCategory: 'Management',
    columns: [
      { key: 'index', label: 'S.No' },
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'phone', label: 'Phone' },
      { key: 'designation', label: 'Designation' },
    ],
  },
  Staff: {
    title: 'Teacher Bulk Upload',
    detailsTitle: 'Teacher Details',
    addButtonLabel: 'Add Staff',
    userType: 'teacher',
    templateCategory: 'Staff',
    columns: [
      { key: 'index', label: 'S.No' },
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'phone', label: 'Phone' },
      { key: 'designation', label: 'Designation' },
    ],
  },
  Student: {
    title: 'Student Bulk Upload',
    detailsTitle: 'Student Details',
    addButtonLabel: 'Add Student',
    userType: 'student',
    templateCategory: 'Student',
    columns: [
      { key: 'index', label: 'S.No' },
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'phone', label: 'Phone' },
      { key: 'class_name', label: 'Class' },
      { key: 'section', label: 'Section' },
      { key: 'class_teacher', label: 'Class Teacher' },
    ],
  },
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    padding: "10px",
  },
exportBtn: {
    backgroundColor: '#2563eb', 
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginBottom: '16px', 
  },
header: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 20px",
  backgroundColor: "#fff",
},

  logoBox: {
    border: "1px dashed #999",
    width: "100px",
    height: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "10px",
    cursor: "pointer",
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  logoUploadWrap: {
    width: "150px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "4px",
  },

schoolNameBox: {
  fontWeight: "bold",
  textAlign: "center",
  flex: 1, // ✅ takes middle space only
},
  logoutBtn: {
    backgroundColor: "#a0a0a0",
    color: "white",
    border: "none",
    padding: "8px 20px",
    borderRadius: "20px",
    cursor: "pointer",
  },

  navBar: {
    display: "flex",
    overflowX: "auto",
    backgroundColor: "#f3a673",
    padding: "0 10px",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  navTab: {
    padding: "12px 20px",
    color: "white",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  activeTab: {
    borderBottom: "3px solid #333",
    color: "#000",
  },

  mainContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    padding: "20px",
    margin: "10px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  },

  uploadsMainContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    padding: "20px",
    margin: "10px",
  },

  uploadCenterWrap: {
    width: "100%",
    maxWidth: "820px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },

  uploadFieldsRow: {
    width: "fit-content",
    display: "grid",
    gridTemplateColumns: "repeat(2, 235px)",
    gap: "10px",
    justifyContent: "center",
  },

  uploadFieldInput: {
    width: "100%",
    maxWidth: "100%",
  },

  uploadButtonsRow: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  uploadPreviewCard: {
    width: "100%",
    marginTop: "18px",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },

  uploadPreviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    padding: "16px 18px",
    borderBottom: "1px solid #e2e8f0",
    background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
  },

  uploadPreviewTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#1f2937",
  },

  uploadPreviewSubtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  uploadPreviewDownloadBtn: {
    backgroundColor: "#1b1b1c",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },

  uploadPreviewTableWrap: {
    width: "100%",
    overflowX: "auto",
  },

  uploadPreviewTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "720px",
  },

  uploadPreviewTh: {
    position: "sticky",
    top: 0,
    backgroundColor: "#334155",
    color: "#fff",
    padding: "12px 10px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  uploadPreviewTd: {
    borderTop: "1px solid #e2e8f0",
    padding: "11px 10px",
    fontSize: "13px",
    color: "#1f2937",
    whiteSpace: "nowrap",
  },

  excelPreviewOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    zIndex: 2000,
  },

  excelPreviewModal: {
    width: "min(1100px, 100%)",
    maxHeight: "88vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(15, 23, 42, 0.28)",
  },

  excelPreviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    padding: "18px 20px",
    borderBottom: "1px solid #e2e8f0",
    background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
  },

  excelPreviewTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#111827",
  },

  excelPreviewSubtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  excelPreviewActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  excelPreviewPickBtn: {
    backgroundColor: "#404040",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
    marginTop:'20px'
  },

  excelPreviewTemplateBtn: {
    backgroundColor: "#404040",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },

  excelPreviewSubmitBtn: {
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },

  excelPreviewCloseBtn: {
    backgroundColor: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
paginationContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 10px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderTop: "none",
    flexWrap: "wrap",
    gap: "10px"
  },
  paginationInfo: {
    fontSize: "14px",
    color: "#475569"
  },
  paginationButtons: {
    display: "flex",
    gap: "5px",
    alignItems: "center"
  },
  paginationBtn: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    transition: "background-color 0.2s"
  },
  paginationSelect: {
    width: "130px"
  },
  excelPreviewSummary: {
    padding: "12px 20px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: "13px",
  },

  excelValidationBox: {
    margin: "12px 20px 0",
    padding: "12px 14px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    fontSize: "13px",
    lineHeight: 1.45,
  },

  excelValidationList: {
    margin: "6px 0",
    paddingLeft: "18px",
  },

  excelSampleBox: {
    margin: "12px 20px",
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#f8fbff",
  },

  excelSampleHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    padding: "12px 14px",
    borderBottom: "1px solid #dbeafe",
    color: "#1e3a8a",
    fontSize: "13px",
  },

  excelPreviewEmptyState: {
    padding: "28px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "10px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 210px",
    marginBottom: "10px",
  },

  label: {
    fontSize: "12px",
    color: "#475569",
    marginBottom: "6px",
    fontWeight: 600,
    textAlign: "center",
  },

  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cfd8e3",
    width: "100%",
    fontSize: "15px",
    backgroundColor: "#fff",
  },

  inputError: {
    borderColor: "#dc2626",
    boxShadow: "0 0 0 2px rgba(220, 38, 38, 0.12)",
  },

  errorText: {
    color: "#dc2626",
    fontSize: "11px",
    lineHeight: 1.35,
    marginTop: "4px",
    textAlign: "left",
  },

  nextBtn: {
    backgroundColor: "#333",
    color: "white",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  photoBox: {
    border: "2px solid #ff4d6d",
    borderRadius: "12px",
    height: "80px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    cursor: "pointer",
    overflow: "hidden",
  },

  photoBoxError: {
    borderColor: "#dc2626",
    boxShadow: "0 0 0 2px rgba(220, 38, 38, 0.12)",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  iconStyle: {
    width: "30px",
    opacity: 0.4,
  },

  updateIconStyle: {
    width: "50px",
    cursor: "pointer",
  },

  uploadSection: {
    padding: "10px",
  },

  userEditorContent: {
    padding: "20px",
    margin: "10px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  },

  userEditorWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  userEditorHeader: {
    background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
    border: "1px solid #dce8ff",
    borderRadius: "18px",
    padding: "18px 20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  },

  userEditorTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#1f2937",
    letterSpacing: "-0.3px",
  },

  userEditorSubtitle: {
    margin: "6px 0 0",
    color: "#5b6472",
    fontSize: "14px",
    lineHeight: 1.5,
    maxWidth: "840px",
  },

  sectionHeading: {
    fontSize: "16px",
    color: "#666",
    textAlign: "center",
    marginBottom: "15px",
  },

  inputGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  },

  actionBtn: {
    backgroundColor: "#444",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
  },

  uploadBtn: {
    backgroundColor: "#404040",
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    textAlign: "center",
  },

  submitBtn: {
    backgroundColor: "#333",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  managementContainer: {
    padding: "10px",
    margin: "10px",
    borderRadius: "8px",
    backgroundColor: "#f5f5f5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  roleRecordsSection: {
    margin: "0 10px 20px",
    padding: "10px",
    borderRadius: "8px",
    backgroundColor: "#f5f5f5",
  },

  roleRecordsTableWrap: {
    overflowX: "auto",
  },

  roleRecordsTable: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
  },

  roleRecordsHeadRow: {
    backgroundColor: "#f6f6f6",
  },

  roleRecordsHeadCell: {
    border: "1px solid #ddd",
    padding: "8px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  roleRecordsCell: {
    border: "1px solid #ddd",
    padding: "8px",
    whiteSpace: "nowrap",
  },

  disabledRoleRow: {
    backgroundColor: "#fee2e2",
    color: "#7f1d1d",
    cursor: "pointer",
  },

  roleRecordsEmpty: {
    padding: "12px 0",
    color: "#777",
  },

  studentFilterBar: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  studentFilterField: {
    flex: "1 1 260px",
  },

  rowActionGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  rowEditIconBtn: {
    width: "36px",
    height: "36px",
    border: "1px solid #9ca3af",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    borderRadius: "8px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  rowDeleteIconBtn: {
    width: "36px",
    height: "36px",
    border: "1px solid #fca5a5",
    backgroundColor: "#fff",
    color: "#dc2626",
    borderRadius: "8px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  accountActionOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backgroundColor: "rgba(15, 23, 42, 0.58)",
  },

  accountActionCard: {
    width: "100%",
    maxWidth: "420px",
    padding: "26px",
    borderRadius: "18px",
    backgroundColor: "#fff",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.3)",
  },

  accountActionTitle: {
    margin: "0 0 8px",
    color: "#111827",
    fontSize: "22px",
  },

  accountActionText: {
    margin: "0 0 20px",
    color: "#4b5563",
    lineHeight: 1.5,
  },

  accountActionButton: {
    width: "100%",
    marginBottom: "10px",
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    backgroundColor: "#f9fafb",
    color: "#111827",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
  },

  accountActionDangerButton: {
    borderColor: "#fca5a5",
    backgroundColor: "#fff5f5",
    color: "#dc2626",
  },

  accountActionCancelButton: {
    width: "100%",
    padding: "11px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "14px",
  },

  tabActionHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },

  addUserBtn: {
    backgroundColor: "#232425",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 1000,
  },

  modalCard: {
    backgroundColor: "#fff",
    padding: "28px",
    borderRadius: "18px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    maxWidth: "980px",
    position: "relative",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.28)",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "20px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
    paddingBottom: "8px",
    borderBottom: "none",
  },

  modalSubtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  modalCloseBtn: {
    border: "none",
    background: "transparent",
    fontSize: "28px",
    lineHeight: 1,
    cursor: "pointer",
    color: "#334155",
  },

  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  credentialsCard: {
    marginBottom: "18px",
    border: "1px solid rgba(134, 239, 172, 0.65)",
    background:
      "linear-gradient(135deg, rgba(240, 253, 244, 0.98) 0%, rgba(220, 252, 231, 0.92) 100%)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 12px 30px rgba(22, 101, 52, 0.12)",
  },

  credentialsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
    color: "#166534",
  },

  credentialsHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  credentialsIconWrap: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#166534",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(22, 101, 52, 0.22)",
    flexShrink: 0,
  },

  credentialsTitle: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#14532d",
    lineHeight: 1.2,
  },

  credentialsSubtitle: {
    marginTop: "2px",
    fontSize: "12px",
    color: "#4b5563",
  },

  credentialsBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
  },

  credentialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },

  credentialsBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    border: "1px solid rgba(134, 239, 172, 0.45)",
    borderRadius: "14px",
    padding: "12px 14px",
    backdropFilter: "blur(4px)",
  },

  credentialsLabel: {
    fontSize: "12px",
    color: "#4b5563",
    marginBottom: "4px",
  },

  credentialsValue: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    wordBreak: "break-word",
  },

  credentialsValueRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    wordBreak: "break-word",
  },

  credentialsMono: {
    fontFamily:
      "ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, Liberation Mono, monospace",
    fontSize: "13px",
    color: "#0f172a",
    wordBreak: "break-all",
  },

  copyMiniBtn: {
    border: "none",
    backgroundColor: "#14532d",
    color: "#fff",
    borderRadius: "999px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: "0 6px 14px rgba(20, 83, 45, 0.18)",
  },

  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
  },

  modalSection: {
    backgroundColor: "#f8fafc",
    padding: "18px",
    borderRadius: "16px",
    border: "1px solid #dbe4f0",
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
  },

  modalSectionTitle: {
    color: "#1f2937",
    marginBottom: "14px",
    paddingBottom: "8px",
    borderBottom: "1px solid #dbe4f0",
    fontSize: "16px",
    fontWeight: 700,
    textAlign: "center",
  },

  photoPreviewLarge: {
    width: "120px",
    height: "120px",
    borderRadius: "4px",
    objectFit: "cover",
    border: "1px solid #ddd",
    backgroundColor: "#f8fafc",
  },

  uploadButton: {
    padding: "8px 15px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    marginRight: "10px",
  },

  removeButton: {
    padding: "8px 15px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
    flexWrap: "wrap",
  },

  cancelActionBtn: {
    border: "none",
    backgroundColor: "#6c757d",
    color: "#fff",
    borderRadius: "4px",
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 500,
  },

  primaryActionBtn: {
    border: "none",
    backgroundColor: "#27ae60",
    color: "#fff",
    borderRadius: "10px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },

  progressFooter: {
    padding: "10px",
  },

  trackerRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
  },

  stepCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "2px dashed #ccc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
  },

  stepLabel: {
    fontSize: "11px",
    textAlign: "center",
  },

  subLabel: {
    fontSize: "10px",
    color: "#888",
    textAlign: "center",
  },
  actionHeaderContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    flexWrap: "wrap",
  },
  exportDropdown: {
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  backgroundColor: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  minWidth: "150px",
  marginBottom:'20px'
},
};
const CentralizationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabName>('Details');
  const [formData, setFormData] = useState<FormDataState>(initialFormData);
  const [detailsErrors, setDetailsErrors] = useState<DetailsFormErrors>({});
  const [uploading, setUploading] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedRecord[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [excelValidationErrors, setExcelValidationErrors] = useState<ExcelValidationError[]>([]);
  const [showExcelSampleRows, setShowExcelSampleRows] = useState(false);
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [previewCategory, setPreviewCategory] = useState<UploadPreviewCategory>('Student');
  const [trackingStats, setTrackingStats] = useState<TrackingStats>({
    teacher: 0,
    student: 0,
    management: 0,
  });

  const [roleUsers, setRoleUsers] = useState<any[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [actionUser, setActionUser] = useState<any | null>(null);
  const [studentClassFilter, setStudentClassFilter] = useState('');
  const [studentSectionFilter, setStudentSectionFilter] = useState('');
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddUserSubmitting, setIsAddUserSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | number | null>(null);
  const [userModalMode, setUserModalMode] = useState<'add' | 'edit'>('add');
  const [studentPhotoPreview, setStudentPhotoPreview] = useState('');
  const [studentPhotoFile, setStudentPhotoFile] = useState<File | null>(null);
  const studentPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [addUserForm, setAddUserForm] = useState<AddUserFormState>(createAddUserForm('student'));

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [allSections, setAllSections] = useState<any[]>([]);

  useEffect(() => {
    setExcelFile(null);
    setUploadedData([]);
    setPreviewData([]);
    setExcelValidationErrors([]);
    setShowExcelSampleRows(false);
    setCurrentPage(1);
  }, [activeTab]);

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

        const urls = [
          `https://cleezoclass.com:5000/api/api/school-lookup?${query.toString()}`,
          `https://cleezoclass.com:5000/api/school-lookup?${query.toString()}`,
        ];

        let data: SchoolApiResponse | null = null;
        for (const url of urls) {
          try {
            const res = await axios.get<SchoolApiResponse>(url);
            data = res.data;
            break;
            
          } catch {
            // Try fallback url
          }
        }

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
          email_app_key: data.email_app_key || '',
          institute_contact_number: data.institute_contact_number || '',
        });
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    loadSchoolDetails();
  }, []);
const downloadBackup = async () => {
  try {
    const schoolCode = localStorage.getItem("schoolCode");

    const response = await axios.get(
      "https://cleezoclass.com:5000/api/download-backup",
      {
        params: {
          schoolCode,
        },
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(response.data);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${schoolCode}.sql`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Backup failed");
  }
};
  const activeRoleTab: RoleTab | null =
    activeTab === 'Management' || activeTab === 'Staff' || activeTab === 'Student'
      ? activeTab
      : null;

  const applyRoleUsersResponse = useCallback(
    (data: any) => {
      const users = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      const pagination = data?.pagination || {};
      const resolvedTotalRecords = Number(pagination.totalRecords || pagination.total || users.length || 0);
      const resolvedTotalPages = Number(
        pagination.totalPages || pagination.pages || Math.max(1, Math.ceil(resolvedTotalRecords / pageSize))
      );

      setRoleUsers(users);
      setTotalPages(Math.max(1, resolvedTotalPages || 1));
      setTotalRecords(resolvedTotalRecords);
    },
    [pageSize]
  );

  useEffect(() => {
    const loadRoleUsers = async () => {
      if (!activeRoleTab) return;

      const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
      if (!schoolCode) return;

      try {
        setRoleLoading(true);
        const response = await axios.post('https://cleezoclass.com:5000/api/users-centralization', {
          schoolCode,
          user_type: roleTabConfig[activeRoleTab].userType,
          page: currentPage,
          limit: pageSize,
          class_name: studentClassFilter,
          section: studentSectionFilter,
          name: studentNameFilter,
        });

        applyRoleUsersResponse(response.data);
      } catch (error) {
        console.error(`Failed to fetch ${activeRoleTab.toLowerCase()} users:`, error);
        setRoleUsers([]);
        setTotalPages(1);
        setTotalRecords(0);
      } finally {
        setRoleLoading(false);
      }
    };

    loadRoleUsers();
  }, [
    activeRoleTab,
    applyRoleUsersResponse,
    formData.school_code,
    currentPage,
    pageSize,
    studentClassFilter,
    studentSectionFilter,
    studentNameFilter,
  ]);

  useEffect(() => {
    const loadAllClassesAndSections = async () => {
      const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
      if (!schoolCode || activeRoleTab !== 'Student') return;

      try {
        const response = await axios.post('https://cleezoclass.com:5000/api/users', {
          schoolCode,
          user_type: 'student',
        });

        let allStudents: any[] = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            allStudents = response.data;
          } else if (Array.isArray(response.data.users)) {
            allStudents = response.data.users;
          } else if (Array.isArray(response.data.data)) {
            allStudents = response.data.data;
          }
        }

        const uniqueClasses = Array.from(
          new Set(allStudents.map((user) => String(user?.class_name || '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        setAllClasses(uniqueClasses);
        setAllSections(allStudents);
      } catch (error) {
        console.error('Failed to load classes for dropdown:', error);
      }
    };

    loadAllClassesAndSections();
  }, [activeRoleTab, formData.school_code]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const field = name as FormFieldKey;
    const sanitizer = detailSanitizers[field];
    const nextValue = sanitizer ? sanitizer(value) : value;
    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    setDetailsErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, key: FileFieldKey) => {
    const file = e.target.files?.[0] ?? null;
    setFormData((prev) => ({ ...prev, [key]: file }));
    setDetailsErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateImageField = (value: UploadAsset, label: string, required = false) => {
    if (!value) return required ? `${label} is required.` : '';
    if (value instanceof File) {
      if (!value.type.startsWith('image/')) return `${label} must be an image file.`;
    }
    return '';
  };

  const validateDetailsForm = () => {
    const errors: DetailsFormErrors = {};

    if (
      formData.institute_authorized_person.trim() &&
      !textRegex.test(formData.institute_authorized_person.trim())
    ) {
      errors.institute_authorized_person =
        'Authorized Person can contain only letters, spaces, dot, apostrophe, or hyphen.';
    }
    if (formData.email.trim() && !gmailRegex.test(formData.email.trim())) {
      errors.email = 'Enter a valid Gmail address, for example name@gmail.com.';
    }
    if (
      formData.institute_contact_number.trim() &&
      !/^[6-9]\d{9}$/.test(formData.institute_contact_number.trim())
    ) {
      errors.institute_contact_number =
        'Institute Contact Number must be a valid 10-digit mobile number.';
    }
    const normalizedAppKey = formData.email_app_key.replace(/\s+/g, '');
    if (
      formData.email_app_key.trim() &&
      (!/^[A-Za-z0-9-]+$/.test(formData.email_app_key.trim()) || normalizedAppKey.length < 8)
    ) {
      errors.email_app_key =
        'Email App Key must be at least 8 letters/numbers and cannot contain special characters.';
    }
    if (formData.city.trim() && !textRegex.test(formData.city.trim())) {
      errors.city = 'City can contain only letters, spaces, dot, apostrophe, or hyphen.';
    }
    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 digits.';
    }
    if (
      formData.registration_no.trim() &&
      !alphaNumericRegex.test(formData.registration_no.trim())
    ) {
      errors.registration_no =
        'School Reg. No. can contain letters, numbers, spaces, slash, dot, hash, or hyphen.';
    }

    if (
      String(formData.school_strength || '').trim() &&
      !/^[1-9]\d*$/.test(String(formData.school_strength || '').trim())
    ) {
      errors.school_strength = 'No. of Students must be a positive number.';
    }
    if (
      String(formData.staff_strength || '').trim() &&
      !/^[1-9]\d*$/.test(String(formData.staff_strength || '').trim())
    ) {
      errors.staff_strength = 'No. of Staff must be a positive number.';
    }
    if (formData.tagline.trim() && formData.tagline.trim().length < 2) {
      errors.tagline = 'Branches must be at least 2 characters.';
    }

    const logoError = validateImageField(formData.authorized_logo, detailFieldLabels.authorized_logo);
    if (logoError) errors.authorized_logo = logoError;
    const schoolPhotoError = validateImageField(formData.school_photo, detailFieldLabels.school_photo);
    if (schoolPhotoError) errors.school_photo = schoolPhotoError;
    (['correspondent', 'front_office', 'other_photo'] as FileFieldKey[]).forEach((field) => {
      const fileError = validateImageField(formData[field], detailFieldLabels[field]);
      if (fileError) errors[field] = fileError;
    });

    setDetailsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const detailsInputStyle = (
    field: keyof FormDataState,
    extra?: React.CSSProperties
  ): React.CSSProperties => ({
    ...styles.input,
    ...(detailsErrors[field] ? styles.inputError : {}),
    ...(extra || {}),
  });

  const renderDetailsError = (field: keyof FormDataState) =>
    detailsErrors[field] ? <span style={styles.errorText}>{detailsErrors[field]}</span> : null;

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setStudentPhotoFile(file);
      setStudentPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadStudentPhoto = async () => {
    if (!studentPhotoFile) return addUserForm.photo || '';
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    const uploadData = new FormData();
    uploadData.append('photo', studentPhotoFile);

    const response = await axios.post('https://cleezoclass.com:5000/api/upload-photo', uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { schoolCode },
    });
    return response.data?.photoPath || addUserForm.photo || '';
  };

  const getStudentSectionsForClass = (className: string) =>
    Array.from(
      new Set(
        allSections
          .filter((user) => String(user?.class_name || '').trim() === String(className).trim())
          .map((user) => String(user?.section || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const openAddUserModal = (userType: UserType) => {
    setUserModalMode('add');
    setEditingUserId(null);
    setCreatedCredentials(null);
    setStudentPhotoFile(null);
    setStudentPhotoPreview('');
    setAddUserForm(
      createAddUserForm(userType, {
        school_name: formData.school_name || localStorage.getItem('instituteName') || '',
        address: formData.address || '',
        curriculum: formData.curriculum || '',
      })
    );
    setIsAddUserOpen(true);
  };

  const closeAddUserModal = () => {
    setIsAddUserOpen(false);
    setCreatedCredentials(null);
    setEditingUserId(null);
    setUserModalMode('add');
    setStudentPhotoFile(null);
    setStudentPhotoPreview('');
  };

  const buildUserFormFromRecord = (userType: UserType, user: any): AddUserFormState =>
    createAddUserForm(userType, {
      name: String(user?.name || ''),
      username: String(user?.username || ''),
      password: String(user?.password || ''),
      gender: String(user?.gender || ''),
      phone_no: String(user?.phone_no || user?.phone || ''),
      father_phone_no: String(user?.father_phone_no || ''),
      aadhar_no: String(user?.aadhar_no || ''),
      father_name: String(user?.father_name || ''),
      class_name: String(user?.class_name || ''),
      section: String(user?.section || ''),
      class_teacher: String(user?.class_teacher || ''),
      school_name: String(user?.school_name || formData.school_name || ''),
      address: String(user?.address || formData.address || ''),
      dob: user?.dob ? String(user.dob).split('T')[0] : '',
      admission_no: String(user?.admission_no || ''),
      cbse_reg_no: String(user?.cbse_reg_no || ''),
      curriculum: String(user?.curriculum || formData.curriculum || ''),
      designation: String(user?.designation || ''),
      teaches_to_1: String(user?.teaches_to_1 || ''),
      teaches_to_2: String(user?.teaches_to_2 || ''),
      teaches_to_3: String(user?.teaches_to_3 || ''),
      teaches_to_4: String(user?.teaches_to_4 || ''),
      teaches_to_5: String(user?.teaches_to_5 || ''),
      teaches_to_6: String(user?.teaches_to_6 || ''),
      teaches_to_7: String(user?.teaches_to_7 || ''),
      teaches_to_8: String(user?.teaches_to_8 || ''),
      teaches_to_9: String(user?.teaches_to_9 || ''),
      teaches_to_10: String(user?.teaches_to_10 || ''),
      teaches_to_11: String(user?.teaches_to_11 || ''),
      teaches_to_12: String(user?.teaches_to_12 || ''),
    });

  const openEditUserModal = (user: any) => {
    const userType = (user?.user_type ||
      (activeRoleTab === 'Staff'
        ? 'teacher'
        : activeRoleTab === 'Student'
        ? 'student'
        : 'management')) as UserType;
    const resolvedId =
      user?.id ??
      user?.ID ??
      user?.Id ??
      user?.user_id ??
      user?.userId ??
      user?.staff_id ??
      user?.management_id ??
      null;

    if (resolvedId == null || resolvedId === '') {
      alert('This record does not have a valid id, so it cannot be edited from this screen.');
      return;
    }

    setUserModalMode('edit');
    setEditingUserId(resolvedId);
    setCreatedCredentials(null);
    setAddUserForm(buildUserFormFromRecord(userType, user));
    setStudentPhotoFile(null);
    setStudentPhotoPreview(normalizePhotoUrl(user?.photo));
    setIsAddUserOpen(true);
  };

  const reloadRoleUsers = async () => {
    if (!activeRoleTab) return;
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    if (!schoolCode) return;

    const response = await axios.post('https://cleezoclass.com:5000/api/users-centralization', {
      schoolCode,
      user_type: roleTabConfig[activeRoleTab].userType,
      page: currentPage,
      limit: pageSize,
      class_name: studentClassFilter,
      section: studentSectionFilter,
      name: studentNameFilter,
    });

    applyRoleUsersResponse(response.data);
  };

  const handleAddUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const field = name as keyof AddUserFormState;
    const nameRegex = /^[A-Za-z\s'-]*$/;

    if ((field === 'name' || field === 'father_name') && !nameRegex.test(value)) {
      return;
    }

    if (field === 'phone_no' || field === 'father_phone_no') {
      let numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 10) numericValue = numericValue.slice(0, 10);
      if (numericValue.length > 0 && !/^[6-9]/.test(numericValue)) return;
      setAddUserForm((prev) => ({ ...prev, [field]: numericValue }));
      return;
    }

    if (field === 'aadhar_no') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 12) return;
      setAddUserForm((prev) => ({ ...prev, [field]: numericValue }));
      return;
    }

    setAddUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    if (!schoolCode) {
      alert('School Code missing');
      return;
    }

    const userType = addUserForm.user_type;
    const activePhone = userType === 'student' ? addUserForm.father_phone_no : addUserForm.phone_no;
    if (activePhone && activePhone.length !== 10) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }
    if (addUserForm.aadhar_no && addUserForm.aadhar_no.length !== 12) {
      alert('Aadhar number must be exactly 12 digits.');
      return;
    }

    try {
      setIsAddUserSubmitting(true);
      if (userModalMode === 'edit' && editingUserId != null) {
        const photoPath = studentPhotoFile ? await uploadStudentPhoto() : addUserForm.photo || '';
        const normalizedPhotoPath = typeof photoPath === 'string' ? photoPath : '';
        const editPayload = { ...addUserForm, photo: normalizedPhotoPath };
        const response = await axios.put(
          `https://cleezoclass.com:5000/api/users/${editingUserId}`,
          editPayload,
          { params: { schoolCode }, headers: { 'Content-Type': 'application/json' } }
        );
        alert(response.data?.message || `${userType} updated successfully`);
      } else {
        const photoPath = studentPhotoFile ? await uploadStudentPhoto() : '';
        const normalizedPhotoPath = typeof photoPath === 'string' ? photoPath : '';
        const addPayload = {
          ...addUserForm,
          photo: normalizedPhotoPath,
          schoolCode,
          category: userType,
        };
        const response = await axios.post(
          'https://cleezoclass.com:5000/api/submit-studentData',
          addPayload,
          { params: { schoolCode }, headers: { 'Content-Type': 'application/json' } }
        );

        const responseData = response.data?.data || {};
        setCreatedCredentials({
          name: String(responseData.name || addUserForm.name || ''),
          username: String(responseData.username || addUserForm.username || ''),
          password: String(responseData.password || addUserForm.password || ''),
          user_type: userType,
        });

        alert(response.data?.message || `${userType} added successfully`);
      }

      await reloadRoleUsers();
      setAddUserForm(createAddUserForm(userType));
      setEditingUserId(null);
      if (userModalMode === 'edit') {
        setIsAddUserOpen(false);
      } else {
        setUserModalMode('add');
      }
    } catch (error: any) {
      console.error('Error saving user:', error?.response?.data || error?.message || error);
      alert(
        error?.response?.data?.message ||
          (userModalMode === 'edit' ? 'Failed to update user' : 'Failed to add user')
      );
    } finally {
      setIsAddUserSubmitting(false);
    }
  };

  const copyCredentials = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore copy error
    }
  };

  const handleUpdate = () => {
    if (!validateDetailsForm()) {
      alert('Please fix the highlighted details before updating.');
      return;
    }

    const schoolCode = localStorage.getItem('schoolCode');
    const uploadData = new FormData();
    (Object.keys(formData) as Array<keyof FormDataState>).forEach((key) => {
      const value = formData[key];
      if (key === 'authorized_logo') {
        if (value instanceof File) uploadData.append('logo', value);
        return;
      }
      uploadData.append(key, value instanceof File ? value : value ?? '');
    });

    axios
      .put(
        `https://cleezoclass.com:5000/api/api/schooleditingdatacentralization/${schoolCode}`,
        uploadData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then(() => alert('Updated successfully'))
      .catch((error) => {
        console.error('School details update failed:', error?.response?.data || error?.message || error);
        alert(error?.response?.data?.message || error?.response?.data?.error || 'Update failed');
      });
  };

  const handleCloseExcelPreview = () => {
    setIsExcelPreviewOpen(false);
    setUploadedData([]);
    setPreviewData([]);
    setExcelFile(null);
    setExcelValidationErrors([]);
    setShowExcelSampleRows(false);
  };

  const handleFileUpload = async (category: string) => {
    if (!excelFile) {
      alert('Please choose an Excel file first');
      return;
    }
    if (excelValidationErrors.length > 0) {
      const errorText = excelValidationErrors
        .slice(0, 8)
        .map(
          (err) =>
            `${err.cellAddress ? `Cell ${err.cellAddress}` : `Row ${err.rowNumber}`}: ${err.field} - ${
              err.message
            }`
        )
        .join('\n');
      alert(['Please fix these Excel validation errors before submitting:', errorText].join('\n'));
      return;
    }
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    if (!schoolCode) {
      alert('School Code missing');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', excelFile);
    uploadData.append('school_code', schoolCode);

    try {
      setUploading(true);
      if (activeRoleTab) setPreviewCategory(getUploadPreviewCategory(activeRoleTab));
      const apiCategory = category.toLowerCase() === 'staff' ? 'teacher' : category.toLowerCase();

      const response = await axios.post<UploadResponse>(
        `https://cleezoclass.com:5000/api/upload-excel/${apiCategory}`,
        uploadData,
        {
          params: { schoolCode },
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const { insertedRecords, duplicates, replacedRecords = [], skippedRows = 0 } = response.data;
      setUploadedData(insertedRecords);
      setPreviewData(insertedRecords);
      setIsExcelPreviewOpen(true);
      alert(
        `Upload Successful!\nInserted: ${insertedRecords.length}\nReplaced: ${
          replacedRecords.length || duplicates.length
        }\nSkipped: ${skippedRows}`
      );
      setExcelFile(null);
      setExcelValidationErrors([]);
      setShowExcelSampleRows(false);
    } catch (error) {
      console.error('Excel upload failed:', error);
      if (axios.isAxiosError<UploadResponse>(error)) {
        const serverMessage = error.response?.data?.message;
        const rowErrors = error.response?.data?.rowErrors || [];
        const rowErrorText = rowErrors
          .slice(0, 5)
          .map(
            (r) =>
              `Row ${r.rowNumber}: ${r.designation || r.name || r.message || 'Invalid row'}`
          )
          .join('\n');
        alert([serverMessage || 'Excel upload failed', rowErrorText].filter(Boolean).join('\n'));
      } else {
        alert('Excel upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const getExcelTemplateHeaders = (category: string) => {
    const baseHeaders = ['name', 'gender', 'dob', 'phone_no', 'aadhar_no', 'father_name', 'address'];
    const studentHeaders = [
      ...baseHeaders,
      'class_name',
      'section',
      'class_teacher',
      'admission_no',
      'curriculum',
      'cbse_reg_no',
    ];
    const teacherHeaders = [
      ...baseHeaders,
      'designation',
      'teaches_to_1',
      'teaches_to_2',
      'teaches_to_3',
      'teaches_to_4',
      'teaches_to_5',
      'teaches_to_6',
      'teaches_to_7',
      'teaches_to_8',
      'teaches_to_9',
      'teaches_to_10',
      'teaches_to_11',
      'teaches_to_12',
    ];
    const managementHeaders = [...baseHeaders, 'designation'];

    if (category === 'Staff') return teacherHeaders;
    if (category === 'Management') return managementHeaders;
    return studentHeaders;
  };

  const downloadExcelTemplate = (category: string) => {
    const headers = getExcelTemplateHeaders(category);
    const workbook = XLSX.utils.book_new();
    const sampleRows = category === 'Staff' ? staffTemplateSampleRows : [];
    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      ...sampleRows.map((row) => headers.map((header) => row[header as keyof typeof row] || '')),
    ]);
    const sheetName = category === 'Staff' ? 'TeacherTemplate' : `${category}Template`;
    if (category === 'Staff') {
      worksheet['!cols'] = headers.map((header) => ({
        wch: header.startsWith('teaches_to_') ? 14 : Math.max(header.length + 4, 16),
      }));
    }
    if (category === 'Management') {
      const designationColIndex = headers.indexOf('designation');
      if (designationColIndex >= 0) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: designationColIndex });
        worksheet[cellAddress].c = [
          {
            a: 'Cleezo',
            t: `Use only these designations: ${managementDesignationLabels.join(', ')}`,
          },
        ];
      }
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    if (category === 'Management') {
      const designationSheet = XLSX.utils.aoa_to_sheet([
        ['Allowed Management Designations'],
        ...managementDesignationOptions.map((o) => [o.label]),
      ]);
      XLSX.utils.book_append_sheet(workbook, designationSheet, 'AllowedDesignations');
    }
    XLSX.writeFile(workbook, `${category === 'Staff' ? 'teacher' : category.toLowerCase()}_template.xlsx`);
  };

  const normalizeExcelHeader = (val: string) => val.toLowerCase().trim().replace(/\s+/g, '_');

  const getColumnMeta = (row: any, keys: string[], rowNumber: number) => {
    const foundKey = Object.keys(row).find((col) =>
      keys.some((key) => normalizeExcelHeader(col) === normalizeExcelHeader(key))
    );
    if (!foundKey) {
      return {
        key: keys[0],
        columnNumber: undefined,
        cellAddress: undefined,
        label: formatExcelColumnLabel(keys[0]),
      };
    }
    const columnNumber = Object.keys(row).indexOf(foundKey) + 1;
    return {
      key: foundKey,
      columnNumber,
      cellAddress: `${XLSX.utils.encode_col(columnNumber - 1)}${rowNumber}`,
      label: formatExcelColumnLabel(foundKey),
    };
  };

  const getValue = (row: any, keys: string[]) => {
    for (const key of keys) {
      const foundKey = Object.keys(row).find(
        (col) => normalizeExcelHeader(col) === normalizeExcelHeader(key)
      );
      if (foundKey && row[foundKey] !== undefined) {
        return row[foundKey];
      }
    }
    return '';
  };

  const hasExcelValue = (val: unknown) => val !== undefined && val !== null && String(val).trim() !== '';

  const isNonEmptyExcelRow = (row: any) => Object.values(row || {}).some((val) => hasExcelValue(val));

  const isValidExcelDate = (val: unknown) => {
    if (!hasExcelValue(val)) return true;
    if (val instanceof Date) return !Number.isNaN(val.getTime());

    if (typeof val === 'number' && Number.isFinite(val) && XLSX.SSF?.parse_date_code) {
      const parsed = XLSX.SSF.parse_date_code(val);
      return Boolean(parsed?.y && parsed?.m && parsed?.d);
    }

    const text = String(val).trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  };
// Replace your existing validateExcelRows function with this updated version:

const validateExcelRows = (rawData: any[], category: UploadPreviewCategory): ExcelValidationError[] => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[A-Za-z\s.'-]+$/;
  const alphaNumericTextRegex = /^[A-Za-z0-9\s./#-]+$/;
  const phoneKeys = [
    'phone_no',
    'phone_number',
    'phone number',
    'phone',
    'mobile',
    'mobile_number',
    'mobile number',
    'contact_number',
    'whatsapp_number',
    'father_phone',
    'father_phone_no',
    'father_mobile',
    'father_contact',
  ];
  const emailKeys = ['email', 'email_id', 'email id', 'mail', 'email_address', 'email address'];
  const dateKeys = ['dob', 'date_of_birth', 'date of birth', 'birth_date'];

  const createError = (
    row: any,
    rowNumber: number,
    keys: string[],
    message: string
  ): ExcelValidationError => {
    const meta = getColumnMeta(row, keys, rowNumber);
    const expectedColumnIndex = getExcelTemplateHeaders(category).findIndex((header) =>
      keys.some((key) => normalizeExcelHeader(header) === normalizeExcelHeader(key))
    );
    const fallbackColumnNumber = expectedColumnIndex >= 0 ? expectedColumnIndex + 1 : undefined;
    const columnNumber = meta.columnNumber || fallbackColumnNumber;
    return {
      rowNumber,
      columnNumber,
      cellAddress:
        meta.cellAddress ||
        (columnNumber ? `${XLSX.utils.encode_col(columnNumber - 1)}${rowNumber}` : undefined),
      field: meta.label,
      message,
    };
  };

  const validateRequired = (
    row: any,
    rowNumber: number,
    keys: string[],
    label: string,
    errors: ExcelValidationError[]
  ) => {
    if (!hasExcelValue(getValue(row, keys))) {
      errors.push(createError(row, rowNumber, keys, `${label} is required.`));
      return false;
    }
    return true;
  };

const validateConditional = (
  row: any,
  rowNumber: number,
  keys: string[],
  validationFn: (val: unknown) => boolean,
  errorMessage: string,
  errors: ExcelValidationError[]
) => {
  const val = getValue(row, keys);

  if (hasExcelValue(val)) {
    if (!validationFn(val)) {
      errors.push(createError(row, rowNumber, keys, errorMessage));
    }
  }
};

  return rawData.flatMap((row, index) => {
    if (!isNonEmptyExcelRow(row)) return [];

    const rowNumber = index + 2;
    const errors: ExcelValidationError[] = [];

    // Common Keys
    const nameKeys = ['name', 'student_name', 'staff_name', 'manager_name', 'student', 'teacher', 'name'];
    const genderKeys = ['gender', 'sex'];
    const aadharKeys = ['aadhar_no', 'aadhar_number', 'aadhar number', 'aadhar', 'aadhaar'];
    const fatherNameKeys = ['father_name', 'father name', 'dad_name', 'dad', 'father'];
    const classTeacherKeys = ['class_teacher', 'teacher', 'teacher_name'];

    // --- STRICTLY MANDATORY FOR ALL CATEGORIES ---
    if (validateRequired(row, rowNumber, nameKeys, 'Name', errors)) {
      validateConditional(row, rowNumber, nameKeys, (val) => nameRegex.test(val), 'Name can contain only letters, spaces, dot, apostrophe, or hyphen.', errors);
    }

    if (category === 'Student') {
      const classNameKeys = ['class_name', 'class', 'grade'];
      const sectionKeys = ['section', 'sec'];
      const admissionKeys = ['admission_no', 'admission number', 'admission'];
      const curriculumKeys = ['curriculum'];
      const cbseKeys = ['cbse_reg_no', 'cbse reg no', 'cbse registration no'];

      // Class is mandatory for students
      validateRequired(row, rowNumber, classNameKeys, 'Class', errors);
      validateRequired(row, rowNumber, sectionKeys, 'Section', errors);

      [admissionKeys, curriculumKeys, cbseKeys].forEach((keys) => {
        validateConditional(row, rowNumber, keys, (val) => alphaNumericTextRegex.test(val), `${formatExcelColumnLabel(keys[0])} can contain letters, numbers, spaces, slash, dot, hash, or hyphen.`, errors);
      });
    }

    // Optional / Conditional validations for all fields if data is present
    validateConditional(row, rowNumber, genderKeys, (val) => ['male', 'female', 'other'].includes(val.toLowerCase()), 'Gender must be Male, Female, or Other.', errors);

    validateConditional(row, rowNumber, dateKeys, (val) => isValidExcelDate(val), 'Date of Birth must be in YYYY-MM-DD format or a valid Excel date.', errors);

    // Mobile numbers: check only numbers and exact length if provided
phoneKeys.forEach((key) => {
  validateConditional(
    row,
    rowNumber,
    [key],
    (val) => {
      if (!hasExcelValue(val)) return true; // Skip empty cells
      return /^\d{10}$/.test(String(val).trim());
    },
    "Mobile Number must be exactly 10 numeric digits.",
    errors
  );
});

aadharKeys.forEach((key) => {
  validateConditional(
    row,
    rowNumber,
    [key],
    (val) => {
      if (!hasExcelValue(val)) return true; // Skip empty cells
      return /^\d{12}$/.test(String(val).trim());
    },
    "Aadhar Number must be exactly 12 numeric digits.",
    errors
  );
});
    validateConditional(row, rowNumber, fatherNameKeys, (val) => nameRegex.test(val), 'Father Name can contain only letters, spaces, dot, apostrophe, or hyphen.', errors);

    validateConditional(row, rowNumber, classTeacherKeys, (val) => nameRegex.test(val), 'Class Teacher can contain only letters, spaces, dot, apostrophe, or hyphen.', errors);

    emailKeys.forEach((key) => {
      validateConditional(row, rowNumber, [key], (val) => emailRegex.test(val), 'Email should be in a valid format.', errors);
    });

    return errors;
  });
};
  const formatPreviewDob = (val: any) => {
    if (val === undefined || val === null || String(val).trim() === '') return '';
    if (val instanceof Date && !Number.isNaN(val.getTime())) {
      return val.toISOString().slice(0, 10);
    }
    const numericValue = Number(val);
    if (Number.isFinite(numericValue) && XLSX.SSF?.parse_date_code) {
      const parsed = XLSX.SSF.parse_date_code(numericValue);
      if (parsed?.y && parsed?.m && parsed?.d) {
        const month = String(parsed.m).padStart(2, '0');
        const day = String(parsed.d).padStart(2, '0');
        return `${parsed.y}-${month}-${day}`;
      }
    }
    const parsedDate = new Date(String(val).trim());
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().slice(0, 10);
    }
    return String(val).trim();
  };

  const formatExcelColumnLabel = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const formatExcelCellValue = (value: unknown) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value.trim() || '-';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '-';
      }
    }
    return String(value);
  };

  const getUploadPreviewCategory = (roleTab: RoleTab): UploadPreviewCategory =>
    roleTab === 'Staff' ? 'Staff' : roleTab === 'Management' ? 'Management' : 'Student';

  const buildPreviewRows = (rawData: any[], category: UploadPreviewCategory) => {
    if (category === 'Staff') {
      return rawData.map((row: any) => ({
        name: getValue(row, ['name', 'teacher_name', 'teacher', 'staff_name']).toString().toUpperCase() || '',
        gender: getValue(row, ['gender', 'sex']),
        phone_no: getValue(row, ['phone_no', 'phone number', 'phone', 'mobile']),
        aadhar_no: getValue(row, ['aadhar_no', 'aadhar number', 'aadhar', 'aadhaar']),
        dob: formatPreviewDob(getValue(row, ['dob', 'date_of_birth', 'date of birth', 'birth_date'])),
        father_name: getValue(row, ['father_name', 'father name']).toString().toUpperCase() || '',
        address: getValue(row, ['address', 'staff_address']),
        designation: getValue(row, ['designation', 'subject', 'role']),
        teaches_to_1: getValue(row, ['teaches_to_1', 'class 1']),
        teaches_to_2: getValue(row, ['teaches_to_2', 'class 2']),
        teaches_to_3: getValue(row, ['teaches_to_3', 'class 3']),
        teaches_to_4: getValue(row, ['teaches_to_4', 'class 4']),
        teaches_to_5: getValue(row, ['teaches_to_5', 'class 5']),
        teaches_to_6: getValue(row, ['teaches_to_6', 'class 6']),
        teaches_to_7: getValue(row, ['teaches_to_7', 'class 7']),
        teaches_to_8: getValue(row, ['teaches_to_8', 'class 8']),
        teaches_to_9: getValue(row, ['teaches_to_9', 'class 9']),
        teaches_to_10: getValue(row, ['teaches_to_10', 'class 10']),
        teaches_to_11: getValue(row, ['teaches_to_11', 'class 11']),
        teaches_to_12: getValue(row, ['teaches_to_12', 'class 12']),
      }));
    }

    if (category === 'Management') {
      return rawData.map((row: any) => ({
        name: getValue(row, ['name', 'manager_name', 'staff_name']).toString().toUpperCase() || '',
        gender: getValue(row, ['gender', 'sex']),
        phone_no: getValue(row, ['phone_no', 'phone number', 'phone', 'mobile']),
        aadhar_no: getValue(row, ['aadhar_no', 'aadhar number', 'aadhar', 'aadhaar']),
        dob: formatPreviewDob(getValue(row, ['dob', 'date_of_birth', 'date of birth', 'birth_date'])),
        father_name: getValue(row, ['father_name', 'father name']).toString().toUpperCase() || '',
        address: getValue(row, ['address', 'management_address']),
        designation: getValue(row, ['designation', 'role']),
      }));
    }

    return rawData.map((row: any) => ({
      student_name:
        getValue(row, ['student_name', 'student name', 'name', 'student']).toString().toUpperCase() || '',
      gender: getValue(row, ['gender', 'sex']),
      phone_number: getValue(row, [
        'phone_no',
        'phone_number',
        'phone number',
        'phone',
        'mobile',
        'father_phone',
        'father_mobile',
      ]),
      aadhar_number: getValue(row, ['aadhar_no', 'aadhar_number', 'aadhar number', 'aadhar', 'aadhaar']),
      dob: formatPreviewDob(getValue(row, ['dob', 'date_of_birth', 'date of birth', 'birth_date'])),
      father_name:
        getValue(row, ['father_name', 'father name', 'dad_name', 'dad', 'father']).toString().toUpperCase() || '',
      class: getValue(row, ['class', 'class_name', 'grade']),
      section: getValue(row, ['section', 'sec']),
      class_teacher:
        getValue(row, ['class_teacher', 'teacher', 'teacher_name']).toString().toUpperCase() || '',
      address: getValue(row, ['address', 'student_address']),
    }));
  };

  const handlePreview = (file: File, category: UploadPreviewCategory) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      const formattedData = buildPreviewRows(rawData, category);
      const validationErrors = validateExcelRows(rawData, category);
      setPreviewData(formattedData);
      setExcelValidationErrors(validationErrors);
      setPreviewCategory(category);
      setIsExcelPreviewOpen(true);
    };
    reader.readAsBinaryString(file);
  };

  const downloadExcel = () => {
    if (uploadedData.length === 0) {
      alert('No data to download');
      return;
    }
    const dataWithWhatsapp = uploadedData.map((item) => {
      const itemPhone = typeof item.phone === 'string' ? item.phone : '';
      const phoneNo = typeof item.phone_no === 'string' ? item.phone_no : '';
      const fatherPhoneNo = typeof item.father_phone_no === 'string' ? item.father_phone_no : '';
      const phone = itemPhone.trim() !== '' ? itemPhone : phoneNo || fatherPhoneNo || '';
      const whatsappLink = phone ? `https://wa.me/${phone}` : 'N/A';
      return { ...item, phone, whatsappLink };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataWithWhatsapp);
    XLSX.utils.book_append_sheet(wb, ws, 'UploadedData');
    XLSX.writeFile(wb, 'uploaded_data.xlsx');
  };

  const stepColors = ['#3182ce', '#c05621', '#ecc94b', '#3182ce', '#48bb78'];

  const filteredRoleUsers =
    activeRoleTab === 'Student'
      ? roleUsers.filter((user) => {
          const classMatch = studentClassFilter
            ? String(user?.class_name || '').trim().toLowerCase() === String(studentClassFilter).trim().toLowerCase()
            : true;
          const sectionMatch = studentSectionFilter
            ? String(user?.section || '').trim().toLowerCase() === String(studentSectionFilter).trim().toLowerCase()
            : true;
          const nameMatch = studentNameFilter
            ? String(user?.name || '').trim().toLowerCase().includes(String(studentNameFilter).trim().toLowerCase())
            : true;
          return classMatch && sectionMatch && nameMatch;
        })
      : roleUsers;

  const studentClassOptions = allClasses;

  const studentSectionOptions = Array.from(
    new Set(
      allSections
        .filter((user) =>
          studentClassFilter
            ? String(user?.class_name || '').trim().toLowerCase() === String(studentClassFilter).trim().toLowerCase()
            : true
        )
        .map((user) => String(user?.section || '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const getUserRecordId = (user: any) =>
    user?.id ??
    user?.ID ??
    user?.Id ??
    user?.user_id ??
    user?.userId ??
    user?.staff_id ??
    user?.management_id ??
    null;

  const isUserDisabled = (user: any) =>
    Number(user?.is_disabled || user?.disabled || 0) === 1 ||
    String(user?.status || '').trim().toLowerCase() === 'disabled';

  const deleteUser = async (user: any) => {
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    const userId = getUserRecordId(user);
    if (!schoolCode || !userId) return;
    try {
      setRoleLoading(true);
      setActionUser(null);
      await axios.delete(`https://cleezoclass.com:5000/api/users/${userId}`, {
        params: { schoolCode },
        data: { schoolCode },
      });
      await reloadRoleUsers();
      alert('Deleted permanently');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed');
    } finally {
      setRoleLoading(false);
    }
  };

  const toggleUserDisabled = async (user: any) => {
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    const userId = getUserRecordId(user);
    if (!schoolCode || !userId) return;

    const disabled = !isUserDisabled(user);
    const action = disabled ? 'disable' : 'enable';

    try {
      setRoleLoading(true);
      setActionUser(null);
      await axios.patch(
        `https://cleezoclass.com:5000/api/users/${userId}/disabled`,
        { schoolCode, disabled },
        { params: { schoolCode } }
      );
      await reloadRoleUsers();
      alert(disabled ? 'User disabled. Login is blocked now.' : 'User enabled. Login works now.');
    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(`${action === 'disable' ? 'Disable' : 'Enable'} failed`);
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    const schoolCode = formData.school_code || localStorage.getItem('schoolCode');
    if (!schoolCode) return;

    axios
      .get<TrackingApiResponse>(`https://cleezoclass.com:5000/track-records/${schoolCode}`)
      .then((res) => {
        if (res.data.success) {
          setTrackingStats(res.data.stats);
        }
      })
      .catch((err: Error) => {
        console.error('Tracker Sync Critical error during fetch:', err.message);
      });
  }, [uploadedData, formData.school_code]);

  const isStepComplete = (stepTitle: StepTitle) => {
    switch (stepTitle) {
      case 'Details':
        return !!(formData.school_name && formData.address);
      case 'Management':
        return trackingStats.management > 0 || !!formData.school_code;
      case 'Staff':
        return trackingStats.teacher > 0;
      case 'Students':
        return trackingStats.student > 0;
      case 'Uploaded Files':
        return !!(formData.latitude && formData.longitude);
      default:
        return false;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/', { replace: true });
  };

  const addUserTypeLabel =
    addUserForm.user_type === 'management'
      ? 'Management'
      : addUserForm.user_type === 'teacher'
      ? 'Teacher'
      : 'Student';
  const addUserSubmitLabel = `Add ${addUserTypeLabel.toLowerCase()}`;
  const isAddStudent = addUserForm.user_type === 'student';
  const isAddTeacher = addUserForm.user_type === 'teacher';
  const isAddManagement = addUserForm.user_type === 'management';

  const getPaginationRange = () => {
    const siblingCount = 1;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, idx) => idx + 1);
      return [...leftRange, 'DOTS', lastPageIndex];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, idx) => totalPages - rightItemCount + 1 + idx
      );
      return [firstPageIndex, 'DOTS', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, idx) => leftSiblingIndex + idx
      );
      return [firstPageIndex, 'DOTS', ...middleRange, 'DOTS', lastPageIndex];
    }

    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  };

  const renderPaginationControls = () => {
    const safeTotalPages = Math.max(1, totalPages || 1);
    const safeTotalRecords = Math.max(0, totalRecords || roleUsers.length || 0);
    const startRecord = safeTotalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, safeTotalRecords);

    return (
      <div style={styles.paginationContainer}>
        <div style={styles.paginationInfo}>
          Showing {startRecord}-{endRecord} of {safeTotalRecords} {activeRoleTab?.toLowerCase()} records
        </div>

        <div style={styles.paginationButtons}>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
            }}
            style={{ ...styles.input, ...styles.paginationSelect }}
          >
            {[10, 15, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            style={{
              ...styles.paginationBtn,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Prev
          </button>

          {getPaginationRange().map((pageNum, index) => {
            if (pageNum === 'DOTS') {
              return (
                <span key={`dots-${index}`} style={{ margin: '0 8px', alignSelf: 'center', color: '#888' }}>
                  ...
                </span>
              );
            }

            return (
              <button
                type="button"
                key={pageNum}
                onClick={() => setCurrentPage(Number(pageNum))}
                style={{
                  ...styles.paginationBtn,
                  backgroundColor: currentPage === pageNum ? '#f3a673' : '#fff',
                  color: currentPage === pageNum ? '#fff' : '#000',
                  fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage === safeTotalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, safeTotalPages))}
            style={{
              ...styles.paginationBtn,
              opacity: currentPage === safeTotalPages ? 0.5 : 1,
              cursor: currentPage === safeTotalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const getRoleColumnValue = (user: any, columnKey: string, rowIndex: number) => {
    if (columnKey === 'index') {
      return rowIndex + 1;
    }
    if (columnKey === 'phone') {
      return user.phone_no || user.father_phone_no || user.phone || '-';
    }
    return user[columnKey] || '-';
  };

  const exportRoleDetailsToPDF = (users: any[], roleTab: RoleTab) => {
    if (!users.length) {
      alert('No data to export');
      return;
    }

    const config = roleTabConfig[roleTab];
    const doc = new jsPDF({ orientation: 'landscape' });
    const title = `${config.detailsTitle} Export`;
    const exportedAt = new Date().toLocaleString();

    doc.setFontSize(14);
    doc.text(title, 14, 14);
    doc.setFontSize(9);
    doc.text(`Exported: ${exportedAt}`, 14, 21);

    autoTable(doc, {
      startY: 28,
      head: [config.columns.map((column) => column.label)],
      body: users.map((user, rowIndex) =>
        config.columns.map((column) => String(getRoleColumnValue(user, column.key, rowIndex)))
      ),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [51, 65, 85] },
    });

    doc.save(`${roleTab.toLowerCase()}_details.pdf`);
  };

  const exportRoleDetailsToXLSX = (users: any[], roleTab: RoleTab) => {
    if (!users.length) {
      alert('No data to export');
      return;
    }

    const config = roleTabConfig[roleTab];
    const exportRows = users.map((user, rowIndex) =>
      config.columns.reduce<Record<string, string>>((row, column) => {
        row[column.label] = String(getRoleColumnValue(user, column.key, rowIndex));
        return row;
      }, {})
    );

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = config.columns.map((column) => ({
      wch: Math.max(column.label.length + 4, 16),
    }));
    XLSX.utils.book_append_sheet(workbook, worksheet, `${roleTab}Details`);
    XLSX.writeFile(workbook, `${roleTab.toLowerCase()}_details.xlsx`);
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
          <div style={styles.logoUploadWrap}>
            <div
              style={{
                ...styles.logoBox,
                ...(detailsErrors.authorized_logo ? styles.photoBoxError : {}),
              }}
              onClick={() => clickHiddenInput('file-authorized_logo')}
            >
              {formData.authorized_logo ? (
                <img
                  src={
                    formData.authorized_logo instanceof File
                      ? URL.createObjectURL(formData.authorized_logo)
                      : formData.authorized_logo
                  }
                  alt="School Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <>School Logo</>
              )}
              <input
                id="file-authorized_logo"
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'authorized_logo')}
                style={{ display: 'none' }}
              />
            </div>
            {renderDetailsError('authorized_logo')}
          </div>
          <div style={styles.schoolNameBox}>{formData.school_name || 'School Name'}</div>
        </div>
        
       <button  style={styles.logoutBtn} onClick={downloadBackup}>
    Download Database Backup
</button> 
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* NAV BAR */}
      <div style={styles.navBar}>
        {(['Details', 'Management', 'Staff', 'Student'] as TabName[]).map((tab) => (
          <div
            key={tab}
            style={{ ...styles.navTab, ...(activeTab === tab ? styles.activeTab : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={activeTab === 'Uploads' ? styles.uploadsMainContent : styles.mainContent}>
        {activeRoleTab && (
          <div style={styles.managementContainer}>
            <div style={styles.tabActionHeader}>
              <h3 style={styles.sectionHeading}>{roleTabConfig[activeRoleTab].title}</h3>
              <button
                type="button"
                style={styles.addUserBtn}
                onClick={() => openAddUserModal(roleTabConfig[activeRoleTab].userType)}
              >
                {roleTabConfig[activeRoleTab].addButtonLabel}
              </button>
            </div>

            <div style={styles.uploadCenterWrap}>
              <div style={styles.uploadButtonsRow}>
                <button
                  type="button"
                  style={{
                    ...styles.submitBtn,
                    flex: '0 0 auto',
                    minWidth: '150px',
                    backgroundColor: '#404040',
                  }}
                  onClick={() => {
                    setUploadedData([]);
                    setPreviewData([]);
                    setExcelFile(null);
                    setExcelValidationErrors([]);
                    setPreviewCategory(getUploadPreviewCategory(activeRoleTab));
                    setShowExcelSampleRows(false);
                    setIsExcelPreviewOpen(true);
                  }}
                >
                  Upload Excel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DETAILS TAB VIEW --- */}
        {activeTab === 'Details' && (
          <>
            <div>
              <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 1, marginRight: '15px' }}>
                  <label style={styles.label}>School Name</label>
                  <input
                    name="school_name"
                    value={formData.school_name}
                    onChange={handleChange}
                    placeholder="Enter School Name"
                    style={detailsInputStyle('school_name', { backgroundColor: '#f1f5f9', cursor: 'not-allowed' })}
                    readOnly
                  />
                  {renderDetailsError('school_name')}
                </div>

                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Curriculum</label>
                  <select
                    name="curriculum"
                    value={formData.curriculum}
                    onChange={handleChange}
                    style={detailsInputStyle('curriculum')}
                  >
                    <option value="" disabled>
                      Select Curriculum
                    </option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                  </select>
                  {renderDetailsError('curriculum')}
                </div>
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 2, marginRight: '15px' }}>
                  <label style={styles.label}>Address</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter Address"
                    style={detailsInputStyle('address', {
                      backgroundColor: '#f1f5f9',
                      cursor: 'not-allowed',
                    })}
                    readOnly
                  />
                  {renderDetailsError('address')}
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Institute Contact Number</label>
                  <input
                    type="tel"
                    name="institute_contact_number"
                    value={formData.institute_contact_number}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (formData.institute_contact_number.length === 0) {
                        const forbiddenKeys = ['0', '1', '2', '3', '4', '5'];
                        if (forbiddenKeys.includes(e.key)) {
                          e.preventDefault();
                        }
                      }
                    }}
                    placeholder="Enter Contact Number"
                    style={detailsInputStyle('institute_contact_number')}
                    maxLength={10}
                  />
                  {renderDetailsError('institute_contact_number')}
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Authorized Person</label>
                  <input
                    name="institute_authorized_person"
                    value={formData.institute_authorized_person}
                    onChange={handleChange}
                    placeholder="Enter Name"
                    style={detailsInputStyle('institute_authorized_person')}
                  />
                  {renderDetailsError('institute_authorized_person')}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@gmail.com"
                    style={detailsInputStyle('email')}
                  />
                  {renderDetailsError('email')}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email App Key</label>
                  <input
                    name="email_app_key"
                    value={formData.email_app_key}
                    onChange={handleChange}
                    placeholder="Enter App Key"
                    style={detailsInputStyle('email_app_key')}
                  />
                  {renderDetailsError('email_app_key')}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Pincode</label>
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Enter Pincode"
                    style={detailsInputStyle('pincode')}
                    inputMode="numeric"
                    maxLength={6}
                  />
                  {renderDetailsError('pincode')}
                </div>
              </div>
            </div>

            <div style={{ borderLeft: '4px solid #ccc', paddingLeft: '30px' }}>
              <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>School code.</label>
                  <input
                    name="school_code"
                    value={formData.school_code}
                    placeholder="School Code"
                    style={detailsInputStyle('school_code', { width: '100%' })}
                    readOnly
                  />
                  {renderDetailsError('school_code')}
                </div>
                <div style={{ ...styles.inputGroup, flex: 1, marginLeft: '15px' }}>
                  <label style={styles.label}>School Reg. No.</label>
                  <input
                    name="registration_no"
                    value={formData.registration_no}
                    onChange={handleChange}
                    placeholder="Enter Registration Number"
                    style={detailsInputStyle('registration_no', { width: '100%' })}
                  />
                  {renderDetailsError('registration_no')}
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Number of Students</label>
                  <input
                    name="school_strength"
                    value={formData.school_strength}
                    onChange={handleChange}
                    placeholder="No. of Students"
                    style={detailsInputStyle('school_strength')}
                    inputMode="numeric"
                  />
                  {renderDetailsError('school_strength')}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Number of Staff</label>
                  <input
                    name="staff_strength"
                    value={formData.staff_strength}
                    onChange={handleChange}
                    placeholder="No. of Staff"
                    style={detailsInputStyle('staff_strength')}
                    inputMode="numeric"
                  />
                  {renderDetailsError('staff_strength')}
                </div>
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 1, marginRight: '15px' }}>
                  <label style={styles.label}>City</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter City"
                    style={detailsInputStyle('city')}
                  />
                  {renderDetailsError('city')}
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>State</label>
                  <select name="state" value={formData.state} onChange={handleChange} style={detailsInputStyle('state')}>
                    <option value="" disabled>
                      Select State
                    </option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Dadra and Nagar Haveli and Daman and Diu">
                      Dadra and Nagar Haveli and Daman and Diu
                    </option>
                    <option value="Delhi">Delhi</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Puducherry">Puducherry</option>
                  </select>
                  {renderDetailsError('state')}
                </div>
              </div>
            </div>

            <div style={{ borderLeft: '4px solid #ccc', paddingLeft: '30px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 180px)',
                  gap: '20px 20px',
                  justifyContent: 'center',
                }}
              >
                {photoFields.map((photo) => {
                  const photoValue = formData[photo.key];
                  return (
                    <div key={photo.key} style={{ textAlign: 'left' }}>
                      <label style={styles.label1}>{photo.label}</label>
                      <div
                        style={{
                          ...styles.photoBox,
                          ...(detailsErrors[photo.key] ? styles.photoBoxError : {}),
                        }}
                        onClick={() => clickHiddenInput(`file-${photo.key}`)}
                      >
                        {photoValue ? (
                          <img
                            src={photoValue instanceof File ? URL.createObjectURL(photoValue) : photoValue}
                            alt={photo.label}
                            style={styles.previewImage}
                          />
                        ) : (
                          <img src={cameraIcon} alt="camera" style={styles.iconStyle} />
                        )}
                      </div>
                      <input
                        id={`file-${photo.key}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, photo.key)}
                        style={{ display: 'none' }}
                      />
                      {renderDetailsError(photo.key)}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                <div
                  style={{
                    ...styles.photoBox,
                    width: '100px',
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={applicationIcon}
                    alt="Update"
                    onClick={handleUpdate}
                    style={{
                      ...styles.updateIconStyle,
                      width: '80%',
                      height: '80%',
                      objectFit: 'contain',
                      filter:
                        'invert(35%) sepia(100%) saturate(5000%) hue-rotate(180deg) brightness(95%) contrast(90%)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* EXCEL PREVIEW MODAL */}
      {isExcelPreviewOpen && activeRoleTab && (
        <div style={styles.excelPreviewOverlay} onClick={handleCloseExcelPreview}>
          <div style={styles.excelPreviewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.excelPreviewHeader}>
              <div>
                <h4 style={styles.excelPreviewTitle}>
                  {previewCategory === 'Staff'
                    ? uploadedData.length > 0
                      ? 'Uploaded Staff Details'
                      : 'Staff Excel Preview'
                    : previewCategory === 'Management'
                    ? uploadedData.length > 0
                      ? 'Uploaded Management Details'
                      : 'Management Excel Preview'
                    : uploadedData.length > 0
                    ? 'Uploaded Student Details'
                    : 'Student Excel Preview'}
                </h4>
                <p style={styles.excelPreviewSubtitle}>
                  {(uploadedData.length > 0 ? uploadedData : previewData).length} record
                  {(uploadedData.length > 0 ? uploadedData : previewData).length === 1 ? '' : 's'} ready for
                  review
                </p>
              </div>
              <div style={styles.excelPreviewActions}>
                {uploadedData.length === 0 && (
                  <label style={styles.excelPreviewPickBtn}>
                    Choose Excel File
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setExcelFile(file);
                        if (file) {
                          setUploadedData([]);
                          setShowExcelSampleRows(false);
                          handlePreview(file, getUploadPreviewCategory(activeRoleTab));
                        } else {
                          setPreviewData([]);
                          setExcelValidationErrors([]);
                          setShowExcelSampleRows(false);
                        }
                      }}
                    />
                  </label>
                )}
                {!excelFile && uploadedData.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      downloadExcelTemplate(roleTabConfig[activeRoleTab].templateCategory);
                      setShowExcelSampleRows(activeRoleTab === 'Staff');
                    }}
                    style={styles.excelPreviewTemplateBtn}
                  >
                    Download Template
                  </button>
                )}
                {excelFile && (
                  <button
                    type="button"
                    onClick={() => handleFileUpload(roleTabConfig[activeRoleTab].templateCategory)}
                    disabled={uploading || excelValidationErrors.length > 0}
                    style={{
                      ...styles.excelPreviewSubmitBtn,
                      backgroundColor: excelValidationErrors.length > 0 ? '#9ca3af' : '#404040',
                      cursor: uploading || excelValidationErrors.length > 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Submit Excel'}
                  </button>
                )}
                {uploadedData.length > 0 && (
                  <button type="button" onClick={downloadExcel} style={styles.uploadPreviewDownloadBtn}>
                    Download Data
                  </button>
                )}
                <button type="button" onClick={handleCloseExcelPreview} style={styles.excelPreviewCloseBtn}>
                  <IoClose />
                </button>
              </div>
            </div>

            <div style={styles.excelPreviewSummary}>
              <span>Selected file: {excelFile ? excelFile.name : 'No file selected'}</span>
            </div>

            {excelValidationErrors.length > 0 && (
              <div style={styles.excelValidationBox}>
                <strong>
                  {excelValidationErrors.length} validation error
                  {excelValidationErrors.length === 1 ? '' : 's'} found.
                </strong>
                <ul style={styles.excelValidationList}>
                  {excelValidationErrors.slice(0, 10).map((error, index) => (
                    <li key={`${error.rowNumber}-${error.field}-${index}`}>
                      {error.cellAddress ? `Cell ${error.cellAddress}` : `Row ${error.rowNumber}`}: {error.field} -{' '}
                      {error.message}
                    </li>
                  ))}
                </ul>
                {excelValidationErrors.length > 10 && (
                  <span>Showing first 10 errors. Please fix the remaining rows in Excel.</span>
                )}
              </div>
            )}

            {previewCategory === 'Staff' &&
            showExcelSampleRows &&
            !excelFile &&
            uploadedData.length === 0 &&
            previewData.length === 0 ? (
              <div style={styles.excelSampleBox}>
                <div style={styles.excelSampleHeader}>
                  <strong>Sample staff records</strong>
                  <span>
                    Use designation for teacher subject. Use teaches_to_1 to teaches_to_12 for classes taught.
                  </span>
                </div>
                <div style={styles.uploadPreviewTableWrap}>
                  <table style={styles.uploadPreviewTable}>
                    <thead>
                      <tr>
                        {Object.keys(staffTemplateSampleRows[0]).map((column) => (
                          <th key={column} style={styles.uploadPreviewTh}>
                            {formatExcelColumnLabel(column)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {staffTemplateSampleRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          style={{ backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                        >
                          {Object.keys(staffTemplateSampleRows[0]).map((column) => (
                            <td key={column} style={styles.uploadPreviewTd}>
                              {formatExcelCellValue(row[column as keyof typeof row])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {(uploadedData.length > 0 ? uploadedData : previewData).length > 0 ? (
              <div style={styles.uploadPreviewTableWrap}>
                <table style={styles.uploadPreviewTable}>
                  <thead>
                    <tr>
                      {Object.keys((uploadedData.length > 0 ? uploadedData : previewData)[0]).map(
                        (column) => (
                          <th key={column} style={styles.uploadPreviewTh}>
                            {formatExcelColumnLabel(column)}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(uploadedData.length > 0 ? uploadedData : previewData).map((row, rowIndex) => (
                      <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        {Object.keys(row).map((column) => (
                          <td key={column} style={styles.uploadPreviewTd}>
                            {formatExcelCellValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !(
                previewCategory === 'Staff' &&
                showExcelSampleRows &&
                !excelFile &&
                uploadedData.length === 0
              ) ? (
              <div style={styles.excelPreviewEmptyState}>Choose an Excel file to preview the rows here.</div>
            ) : null}
          </div>
        </div>
      )}

      {/* EDIT USER POPUP */}
      {isAddUserOpen && userModalMode === 'edit' && (
        <StudentEditingPopup
          isOpen={isAddUserOpen}
          editingId={editingUserId}
          userType={addUserForm.user_type}
          formData={addUserForm}
          schoolCode={formData.school_code || localStorage.getItem('schoolCode') || ''}
          onFieldChange={(field, value) => {
            setAddUserForm((prev) => ({ ...prev, [field]: value }));
          }}
          onClassChange={(className) => {
            setAddUserForm((prev) => ({ ...prev, class_name: className, section: '' }));
          }}
          classOptions={studentClassOptions}
          getSectionsForClass={getStudentSectionsForClass}
          photoPreview={studentPhotoPreview}
          photoFile={studentPhotoFile}
          onPhotoChange={handleStudentPhotoChange}
          onRemovePhoto={() => {
            setStudentPhotoFile(null);
            setStudentPhotoPreview(normalizePhotoUrl(addUserForm.photo));
          }}
          onCancel={closeAddUserModal}
          onSubmit={handleAddUserSubmit}
          isLoading={isAddUserSubmitting}
        />
      )}

      {/* ADD USER MODAL */}
      {isAddUserOpen && userModalMode === 'add' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{`Add ${addUserTypeLabel}`}</h3>
                <p style={styles.modalSubtitle}>{`Create a new ${addUserForm.user_type} account for this school.`}</p>
              </div>
              <button type="button" onClick={closeAddUserModal} style={styles.modalCloseBtn}>
                ×
              </button>
            </div>

            {createdCredentials && (
              <div style={styles.credentialsCard}>
                <div style={styles.credentialsHeader}>
                  <div style={styles.credentialsHeaderLeft}>
                    <div style={styles.credentialsIconWrap}>✓</div>
                    <div>
                      <div style={styles.credentialsTitle}>User created successfully</div>
                      <div style={styles.credentialsSubtitle}>Copy these login details before closing the panel.</div>
                    </div>
                  </div>
                  <span style={styles.credentialsBadge}>{createdCredentials.user_type}</span>
                </div>
                <div style={styles.credentialsGrid}>
                  <div style={styles.credentialsBlock}>
                    <div style={styles.credentialsLabel}>Name</div>
                    <div style={styles.credentialsValue}>{createdCredentials.name || '-'}</div>
                  </div>
                  <div style={styles.credentialsBlock}>
                    <div style={styles.credentialsLabel}>Username</div>
                    <div style={styles.credentialsValueRow}>
                      <span style={styles.credentialsMono}>{createdCredentials.username || '-'}</span>
                      <button
                        type="button"
                        style={styles.copyMiniBtn}
                        onClick={() => copyCredentials(createdCredentials.username || '')}
                        disabled={!createdCredentials.username}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div style={styles.credentialsBlock}>
                    <div style={styles.credentialsLabel}>Password</div>
                    <div style={styles.credentialsValueRow}>
                      <span style={styles.credentialsMono}>{createdCredentials.password || '-'}</span>
                      <button
                        type="button"
                        style={styles.copyMiniBtn}
                        onClick={() => copyCredentials(createdCredentials.password || '')}
                        disabled={!createdCredentials.password}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} style={styles.modalForm}>
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Personal Information</h4>
                <div style={{ ...styles.modalGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name *</label>
                    <input
                      name="name"
                      value={addUserForm.name}
                      onChange={handleAddUserChange}
                      style={{ ...styles.input, textTransform: 'uppercase' }}
                      placeholder="Enter full name"
                      pattern="[A-Za-z\s'-]*"
                      title="Only alphabets, spaces, hyphens, and apostrophes are allowed."
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Gender</label>
                    <select name="gender" value={addUserForm.gender} onChange={handleAddUserChange} style={styles.input}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Date of Birth</label>
                    <input type="date" name="dob" value={addUserForm.dob} onChange={handleAddUserChange} style={styles.input} />
                  </div>
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Contact Information</h4>
                <div style={{ ...styles.modalGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>
                      {isAddStudent ? "Father's Phone Number *" : 'Phone Number *'}
                    </label>
                    <input
                      name={isAddStudent ? 'father_phone_no' : 'phone_no'}
                      value={isAddStudent ? addUserForm.father_phone_no : addUserForm.phone_no}
                      onChange={handleAddUserChange}
                      style={styles.input}
                      placeholder="10-digit number"
                      maxLength={10}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Aadhar Number</label>
                    <input
                      name="aadhar_no"
                      value={addUserForm.aadhar_no}
                      onChange={handleAddUserChange}
                      style={styles.input}
                      placeholder="12-digit number"
                      maxLength={12}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Father Name</label>
                    <input
                      name="father_name"
                      value={addUserForm.father_name}
                      onChange={handleAddUserChange}
                      style={styles.input}
                      placeholder="Enter father name"
                      pattern="[A-Za-z\s'-]*"
                      title="Only alphabets, spaces, hyphens, and apostrophes are allowed."
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>School Name</label>
                    <input
                      name="school_name"
                      value={addUserForm.school_name}
                      onChange={handleAddUserChange}
                      style={{ ...styles.input, backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                      readOnly
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Address</label>
                    <textarea
                      name="address"
                      value={addUserForm.address}
                      onChange={handleAddUserChange}
                      style={{
                        ...styles.input,
                        minHeight: '84px',
                        resize: 'vertical',
                        backgroundColor: '#f1f5f9',
                        cursor: 'not-allowed',
                      }}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {isAddStudent && (
                <>
                  <div style={styles.modalSection}>
                    <h4 style={styles.modalSectionTitle}>Student Details</h4>
                    <div style={{ ...styles.modalGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Class*</label>
                        <select
                          name="class_name"
                          value={addUserForm.class_name}
                          onChange={(e) => {
                            setAddUserForm((prev) => ({ ...prev, class_name: e.target.value, section: '' }));
                          }}
                          style={styles.input}
                        >
                          <option value="">-- Select Class --</option>
                          {studentClassOptions.map((className) => (
                            <option key={className} value={className}>
                              {className}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Section</label>
                        <select
                          name="section"
                          value={addUserForm.section}
                          onChange={handleAddUserChange}
                          style={styles.input}
                          disabled={!addUserForm.class_name}
                        >
                          <option value="">-- Select Section --</option>
                          {getStudentSectionsForClass(addUserForm.class_name).map((sec) => (
                            <option key={sec} value={sec}>
                              {sec}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Class Teacher</label>
                        <input
                          type="text"
                          name="class_teacher"
                          value={addUserForm.class_teacher}
                          onChange={handleAddUserChange}
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.modalSection}>
                    <h4 style={styles.modalSectionTitle}>Academic IDs</h4>
                    <div style={{ ...styles.modalGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Admission No.</label>
                        <input
                          type="text"
                          name="admission_no"
                          value={addUserForm.admission_no}
                          onChange={handleAddUserChange}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Curriculum</label>
                        <input
                          type="text"
                          name="curriculum"
                          value={addUserForm.curriculum || ''}
                          onChange={handleAddUserChange}
                          placeholder="e.g. CBSE / ICSE"
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>CBSE Reg No.</label>
                        <input
                          type="text"
                          name="cbse_reg_no"
                          value={addUserForm.cbse_reg_no}
                          onChange={handleAddUserChange}
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(isAddTeacher || isAddManagement) && (
                <div style={styles.modalSection}>
                  <div style={{ ...styles.modalGrid, gridTemplateColumns: '1fr' }}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>{isAddManagement ? 'Designation' : 'Subject'}</label>

                      {isAddManagement ? (
                        <select
                          name="designation"
                          value={addUserForm.designation}
                          onChange={handleAddUserChange}
                          style={styles.input}
                        >
                          <option value="">Select designation</option>
                          {managementDesignationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="designation"
                          value={addUserForm.designation || ''}
                          onChange={handleAddUserChange}
                          style={styles.input}
                          placeholder="Enter Subject"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isAddTeacher && (
                <div style={styles.modalSection}>
                  <h4 style={styles.modalSectionTitle}>Teaching Classes</h4>
                  <div style={{ ...styles.modalGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                      const fieldName = `teaches_to_${num}` as keyof AddUserFormState;
                      return (
                        <div style={styles.inputGroup} key={fieldName}>
                          <label style={styles.label}>Teaches to Class {num}</label>
                          <input
                            type="text"
                            name={fieldName}
                            value={String(addUserForm[fieldName] || '')}
                            onChange={handleAddUserChange}
                            style={styles.input}
                            placeholder={`Class ${num}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={styles.modalActions}>
                <button type="button" onClick={closeAddUserModal} style={styles.cancelActionBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryActionBtn} disabled={isAddUserSubmitting}>
                  {isAddUserSubmitting ? 'Saving...' : addUserSubmitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER STEP TRACKER */}
      <div style={styles.progressFooter}>
        <div style={styles.trackerRow}>
          {([
            { title: 'Details', sub: 'Details Submitted' },
            { title: 'Management', sub: 'Logins Created' },
            { title: 'Staff', sub: 'Staff Created' },
            { title: 'Students', sub: 'Students Created' },
          ] as Array<{ title: StepTitle; sub: string }>).map((step, i, arr) => {
            const isDone = isStepComplete(step.title);
            const color = isDone ? stepColors[i] : '#cfcfcf';
            return (
              <React.Fragment key={i}>
                <div style={{ textAlign: 'center', minWidth: '110px' }}>
                  <div
                    style={{
                      ...styles.stepCircle,
                      borderColor: color,
                      color: color,
                      backgroundColor: isDone ? `${color}15` : '#fff',
                      borderStyle: isDone ? 'solid' : 'dashed',
                      fontWeight: 'bold',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ ...styles.stepLabel, color: isDone ? '#333' : '#999' }}>
                    <strong>{step.title}</strong>
                  </div>
                  <div style={styles.subLabel}>{step.sub}</div>
                </div>
                {i !== arr.length - 1 && (
                  <div style={styles.connectorWrapper}>
                    <div style={{ ...styles.connectorLine, backgroundColor: isDone ? color : '#cfcfcf' }} />
                    <div style={{ ...styles.connectorArrow, borderLeftColor: isDone ? color : '#cfcfcf' }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ROLE RECORDS TABLE */}
      {activeRoleTab && (
        <div style={styles.roleRecordsSection}>
          <h3 style={styles.sectionHeading}>{roleTabConfig[activeRoleTab].detailsTitle}</h3>
          {activeRoleTab === 'Student' && (
            <div style={styles.studentFilterBar}>
              <div style={styles.studentFilterField}>
                <label style={styles.label}>Class</label>
                <select
                  value={studentClassFilter}
                  onChange={(e) => {
                    setStudentClassFilter(e.target.value);
                    setStudentSectionFilter('');
                    setCurrentPage(1);
                  }}
                  style={styles.input}
                >
                  <option value="">All Classes</option>
                  {studentClassOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.studentFilterField}>
                <label style={styles.label}>Section</label>
                <select
                  value={studentSectionFilter}
                  onChange={(e) => {
                    setStudentSectionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={styles.input}
                  disabled={!studentClassFilter}
                >
                  <option value="">All Sections</option>
                  {studentSectionOptions.map((sect) => (
                    <option key={sect} value={sect}>
                      {sect}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.studentFilterField}>
                <label style={styles.label}>Name</label>
                <input
                  value={studentNameFilter}
                  onChange={(e) => {
                    setStudentNameFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search student name"
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {roleLoading ? (
            <div style={styles.roleRecordsEmpty}>Loading {activeRoleTab.toLowerCase()} users...</div>
          ) : roleUsers.length === 0 ? (
            <div style={styles.roleRecordsEmpty}>No {activeRoleTab.toLowerCase()} users found.</div>
          ) : (
            <div style={styles.roleRecordsTableWrap}>
              <div style={styles.actionHeaderContainer}>
                <select
                  style={styles.exportDropdown}
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'pdf') {
                      exportRoleDetailsToPDF(filteredRoleUsers, activeRoleTab);
                    } else if (value === 'xlsx') {
                      exportRoleDetailsToXLSX(filteredRoleUsers, activeRoleTab);
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>
                    Export
                  </option>
                  <option value="pdf">Export PDF</option>
                  <option value="xlsx">Export XLSX</option>
                </select>
              </div>
              <table style={styles.roleRecordsTable}>
                <thead>
                  <tr style={styles.roleRecordsHeadRow}>
                    {roleTabConfig[activeRoleTab].columns.map((column) => (
                      <th key={column.key} style={styles.roleRecordsHeadCell}>
                        {column.label}
                      </th>
                    ))}
                    <th style={styles.roleRecordsHeadCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoleUsers.map((user, index) => {
                    const userId = getUserRecordId(user) ?? `${user.username || user.name}-${index}`;
                    const disabled = isUserDisabled(user);
                    const rowIndex = (currentPage - 1) * pageSize + index;
                    return (
                      <tr
                        key={userId}
                        style={disabled ? styles.disabledRoleRow : undefined}
                        onClick={() => {
                          if (disabled) setActionUser(user);
                        }}
                      >
                        {roleTabConfig[activeRoleTab].columns.map((column) => {
                          const value =
                            column.key === 'phone'
                              ? user.phone_no || user.father_phone_no || user.phone || '-'
                              : getRoleColumnValue(user, column.key, rowIndex);
                          return (
                            <td key={column.key} style={styles.roleRecordsCell}>
                              {value}
                            </td>
                          );
                        })}
                        <td style={styles.roleRecordsCell}>
                          <div style={styles.rowActionGroup}>
                            <button
                              type="button"
                              style={styles.rowEditIconBtn}
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditUserModal(user);
                              }}
                              aria-label="Edit user"
                            >
                              <Pencil size={16} strokeWidth={2.2} />
                            </button>

                            <button
                              type="button"
                              style={{
                                ...styles.rowEditIconBtn,
                                color: isUserDisabled(user) ? '#059669' : '#d97706',
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleUserDisabled(user);
                              }}
                              aria-label={isUserDisabled(user) ? 'Enable user' : 'Disable user'}
                            >
                              {isUserDisabled(user) ? (
                                <Unlock size={16} strokeWidth={2.2} />
                              ) : (
                                <Ban size={16} strokeWidth={2.2} />
                              )}
                            </button>

                            <button
                              type="button"
                              style={styles.rowDeleteIconBtn}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (window.confirm('Are you sure you want to permanently delete this user?')) {
                                  deleteUser(user);
                                }
                              }}
                              aria-label="Delete user"
                            >
                              <Trash2 size={16} strokeWidth={2.2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPaginationControls()}
            </div>
          )}
        </div>
      )}

      {/* ACTION OVERLAY DIALOG */}
      {actionUser && (
        <div style={styles.accountActionOverlay} onClick={() => setActionUser(null)}>
          <div
            style={styles.accountActionCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-action-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="account-action-title" style={styles.accountActionTitle}>
              Account Actions
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
              Selected User: <strong>{actionUser.name}</strong> ({actionUser.username || 'No username'})
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActionUser(null)}
                style={styles.cancelActionBtn}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => toggleUserDisabled(actionUser)}
                style={{
                  ...styles.primaryActionBtn,
                  backgroundColor: isUserDisabled(actionUser) ? '#059669' : '#d97706',
                }}
              >
                {isUserDisabled(actionUser) ? 'Enable User' : 'Disable User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentralizationDashboard;
