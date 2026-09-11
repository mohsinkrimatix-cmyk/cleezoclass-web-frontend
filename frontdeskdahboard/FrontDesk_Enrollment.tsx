import React, { useState, useEffect, useRef, ChangeEvent, CSSProperties,FormEvent } from "react";
import '../STYLES/solidbutton.css';
import './Frontdesk_Communication.css'
import axios from "axios";
import { FaUser } from "react-icons/fa";
import Select, { MultiValue } from "react-select";
import applicationIcon from '../assets/application.png';
import "./FrontDesk_Admission.css";
import html2pdf from "html2pdf.js";
import ErrorPopup from "../shared/ErrorPopup";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";

// --- Interfaces ---
interface Lead {
  id?: number;
  student_name?: string;
  last_name?: string;
  full_name?: string;
  mother_name?: string;
  dob?: string;
  blood_group?: string;
  lead_admission_for?: string;
  branch?: string;
  address?: string;

  tc_document?: string;
  aadhar_document?: string;
  dob_document?: string;
  appeared_document?: string;
  father_id?: string;
  mother_id?: string;
  address_proof?: string;
}
interface Props {
  selectedLead: Lead | null;
  onLeadUpdate?: (lead: Lead) => void;
}

interface EnrollmentState {
  first_name: string;
  last_name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  blood_group: string;
  admission_for: string;
  branch: string;
  address: string;

  tc_document: File | null;
  aadhar_document: File | null;
  dob_document: File | null;
  appeared_document: File | null;
  father_id: File | null;
  mother_id: File | null;
  address_proof: File | null;

  // 🔹 For already uploaded files from DB
  tc_document_url?: string;
  aadhar_document_url?: string;
  dob_document_url?: string;
  appeared_document_url?: string;
  father_id_url?: string;
  mother_id_url?: string;
  address_proof_url?: string;
}

interface Teacher {
  name: string;
  subject: string;
}

interface ChannelOption {
  value: string;
  label: string;
}

const API_BASE_URL = 'https://cleezoclass.com:4000/api';

// --- Utility Styles ---
const styles: { [key: string]: CSSProperties | any } = {
  scaleFactor: 0.85,
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '15px',
    backgroundColor: '#f5f5f5',
  },
  processHeading: {
    textAlign: 'left',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#444',
    letterSpacing: '1px',
  },
  mainGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  rightColumn: {
    display: 'grid',
    height: '100%',
  },
  equalBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '15px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '1px solid #ccc',
    paddingBottom: '8px',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    padding: '12px',
    borderRadius: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    marginBottom: '15px',
    border: '4px solid #ddd',
    height: '30vh',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sectionContainer1: {
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '15px',
    overflowY: 'auto',
    height: '28vh',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#404040',
    paddingBottom: '4px',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '8px',
  },
  label: {
    fontSize: '10px',
    color: '#555',
    marginBottom: '1px',
    textAlign: 'left'
  },
  input: {
    padding: '6px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    fontSize: '12px',
    width: '150px',
    height: '25px'
  },
};
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date" | "select";
  className?: string;
  style?: React.CSSProperties;
  options?: string[];   // 👈 ADD THIS for select
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  style,
  options = [],
}) => {
  return (
    <div className="inputGroup" style={style}>
      <label className="label">{label}</label>

      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`input ${className || ""}`}
        >
          <option value="">{placeholder || "Select"}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input ${className || ""}`}
        />
      )}
    </div>
  );
};
// --- Sub-Components ---

const Section: React.FC<{ title: string; children: React.ReactNode; variant?: string; style?: CSSProperties }> = ({ title, children, variant = "default", style = {} }) => {
  const compactVariants = ["lead", "marketing"];
  const containerStyle = compactVariants.includes(variant)
    ? styles.sectionContainer1
    : styles.sectionContainer;

  return (
    <div className={compactVariants.includes(variant) ? "co-sectionContainer1" : "co-sectionContainer"} style={style}>
  <div className="co-sectionTitle">{title}</div>
  {children}
</div>

  );
};
interface AdmissionFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: any;
}


const AdmissionFeeModal: React.FC<AdmissionFeeModalProps> = ({
  isOpen,
  onClose,
  studentData,
}) => {
  const [admissionFee, setAdmissionFee] = useState("");
  const [admissionPaid, setAdmissionPaid] = useState("");
  const [advanceFee, setAdvanceFee] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [schoolName, setSchoolName] = useState("School Name");

  const receiptRef = useRef<HTMLDivElement>(null);

  const resetFields = () => {
    setAdmissionFee("");
    setAdmissionPaid("");
    setAdvanceFee("");
  };

  // Fetch school/institute name dynamically using schoolCode
  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => {
        const resolvedSchoolName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.schoolName || data?.name,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Unknown School",
        });
        setSchoolName(resolvedSchoolName);
        localStorage.setItem("schoolName", resolvedSchoolName);
        localStorage.setItem("instituteName", resolvedSchoolName);
      })
      .catch(() => {
        const fallbackSchoolName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Unknown School",
        });
        setSchoolName(fallbackSchoolName);
        localStorage.setItem("schoolName", fallbackSchoolName);
        localStorage.setItem("instituteName", fallbackSchoolName);
      });
  }, [isOpen]);

  if (!isOpen || !studentData) return null;

  // Balance calculation only for Admission Fee
  const balance = Number(admissionFee || 0) - Number(admissionPaid || 0);

  const handleSave = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    if (!admissionFee) {
      alert("Please enter Admission Fee");
      return;
    }

    if (Number(admissionPaid || 0) > Number(admissionFee)) {
      alert("Admission Paid cannot exceed Admission Fee");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "https://cleezoclass.com:4000/pay-admission-fee-lead",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName: studentData.student_name,
            className: studentData.lead_admission_for,
            sectionName: studentData.section || "A",
            schoolCode,
            admissionFee,
            admissionPaid,
            advanceFee,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        alert(result.message);
        return;
      }

      const data = {
        receiptNo: result.receiptNo || Math.floor(Math.random() * 10000),
        date: new Date().toLocaleDateString(),
        studentName: studentData.student_name,
        className: studentData.lead_admission_for,
        section: studentData.section || "A",
        admissionPaid,
        advanceFee,
        balance,
        paymentMode: "Cash",
      };

      setReceiptData(data);
      setShowReceipt(true);
      alert("Admission Fee Saved Successfully!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!receiptRef.current) return;

    html2pdf()
      .set({
        margin: 10,
        filename: `Receipt_${receiptData.receiptNo}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(receiptRef.current)
      .save();
  };

  return (
    <div className="fee-overlay">
      <div className="fee-modal">
        {!showReceipt ? (
          <>
            <h2>Admission Fee Details</h2>
            <div>{studentData.student_name}</div>

            <input
              type="number"
              value={admissionFee}
              onChange={(e) => setAdmissionFee(e.target.value)}
              placeholder="Admission Fee"
            />

            <input
              type="number"
              value={admissionPaid}
              onChange={(e) => setAdmissionPaid(e.target.value)}
              placeholder="Admission Paid"
            />

            <input
              type="number"
              value={advanceFee}
              onChange={(e) => setAdvanceFee(e.target.value)}
              placeholder="School Fee"
            />

            <div>Balance: ₹ {balance > 0 ? balance : 0}</div>

            <button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>

            <button onClick={onClose}>Cancel</button>
          </>
        ) : (
          <>
            <div ref={receiptRef} className="receipt-container">
              {["School Copy", "Parent Copy"].map((copy, index) => (
                <div key={index} className="receipt-box">
                  <div className="receipt-header">
                    <h2>{schoolName}</h2>
                    <div className="copy-label">{copy}</div>
                  </div>

                  <h3 className="receipt-title">FEES RECEIPT</h3>

                  <div className="receipt-details">
                    <div>
                      <p>
                        <b>Receipt No:</b> {receiptData.receiptNo}
                      </p>
                      <p>
                        <b>Student Name:</b> {receiptData.studentName}
                      </p>
                      <p>
                        <b>Class:</b> {receiptData.className}
                      </p>
                    </div>
                    <div>
                      <p>
                        <b>Date:</b> {receiptData.date}
                      </p>
                      <p>
                        <b>Section:</b> {receiptData.section}
                      </p>
                    </div>
                  </div>

                  <table className="receipt-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Fee Details</th>
                        <th>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>Admission Fee</td>
                        <td>{receiptData.admissionPaid}</td>
                      </tr>
                      {Number(receiptData.advanceFee) > 0 && (
                        <tr>
                          <td>2</td>
                          <td>School Fee</td>
                          <td>{receiptData.advanceFee}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="receipt-total">
                    <p>
                      <b>Total Paid:</b> ₹{" "}
                      {Number(receiptData.admissionPaid) +
                        Number(receiptData.advanceFee)}
                    </p>
                    <p>
                      <b>Balance (Admission Fee):</b> ₹{" "}
                      {balance > 0 ? balance : 0}
                    </p>
                    <p>
                      <b>Payment Mode:</b> {receiptData.paymentMode}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="receipt-buttons">
              <button onClick={handlePrint}>Print</button>
              <button onClick={handleDownload}>Download PDF</button>
              <button
                onClick={() => {
                  resetFields();
                  setShowReceipt(false);
                  onClose();
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
const modalStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "10px",
  width: "300px",
};
const EnrollmentSection: React.FC<Props> = ({ selectedLead, onLeadUpdate }) => {
  const [formData, setFormData] = useState<EnrollmentState>({
    first_name: "",
    last_name: "",
    father_name: "",
    mother_name: "",
    dob: "",
    blood_group: "",
    admission_for: "",
    branch: "",
    address: "",
    tc_document: null,
    aadhar_document: null,
    dob_document: null,
    appeared_document: null,
    father_id: null,
    mother_id: null,
    address_proof: null,
  });

  const [popupMsg, setPopupMsg] = useState("");

  useEffect(() => {
    if (selectedLead) {
      const formattedDob = selectedLead.dob
        ? new Date(selectedLead.dob).toISOString().split("T")[0]
        : "";
      setFormData(prev => ({
        ...prev,
        first_name: selectedLead.student_name || "",
        last_name: selectedLead.last_name || "",
        father_name: selectedLead.full_name || "",
        mother_name: selectedLead.mother_name || "",
        admission_for: selectedLead.lead_admission_for || "",
        branch: selectedLead.branch || "",
        address: selectedLead.address || "",
        dob: formattedDob,
        blood_group: selectedLead.blood_group || "",
        tc_document_url: selectedLead.tc_document || "",
        aadhar_document_url: selectedLead.aadhar_document || "",
        dob_document_url: selectedLead.dob_document || "",
        appeared_document_url: selectedLead.appeared_document || "",
        father_id_url: selectedLead.father_id || "",
        mother_id_url: selectedLead.mother_id || "",
        address_proof_url: selectedLead.address_proof || "",
        tc_document: null,
        aadhar_document: null,
        dob_document: null,
        appeared_document: null,
        father_id: null,
        mother_id: null,
        address_proof: null,
      }));
    }
  }, [selectedLead]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files) setFormData({ ...formData, [name]: files[0] });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
const [newStudent, setNewStudent] = useState(null);
const createLogin = async (enrollmentData: EnrollmentState, leadId?: number | string) => {
  try {
    console.log("🚀 Starting login creation for:", enrollmentData);

    const schoolCode = localStorage.getItem("schoolCode");
    console.log("🏫 Retrieved schoolCode from localStorage:", schoolCode);

    if (!schoolCode) {
      setPopupMsg("School information could not be verified. Kindly refresh and try again.");
      console.warn("⚠️ School code missing. Cannot create login.");
      return false;
    }

    const requestBody = {
      first_name: enrollmentData.first_name,
      last_name: enrollmentData.last_name,
      father_name: enrollmentData.father_name,
      dob: enrollmentData.dob,
      address: enrollmentData.address,
      admission_for: enrollmentData.admission_for,
      schoolCode,
      lead_id: leadId || selectedLead?.id || null,
    };
    console.log("📤 Sending request body to API:", requestBody);

    const response = await fetch("https://cleezoclass.com:4000/api/create-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Response received from API. Status:", response.status);

    const result = await response.json();
    console.log("📄 Parsed JSON result:", result);

    if (!response.ok) {
      console.error("❌ Login creation failed:", result.message);
      setPopupMsg(result.message || "Failed to create login. Please try again.");
      return false;
    }

    console.log("✅ Login created successfully:", result.data);
    return true;
  } catch (err) {
    console.error("❌ Login creation error:", err);
    setPopupMsg("An error occurred while creating the login. Please try again.");
    return false;
  }
};
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [enrolledStudent, setEnrolledStudent] = useState<any>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
      setPopupMsg("School information could not be verified. Kindly refresh and try again.");
      return;
    }

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) form.append(key, value);
      else if (value !== undefined && value !== null) form.append(key, value as string);
    });

    form.append("schoolCode", schoolCode);
    if (selectedLead?.id) form.append("id", selectedLead.id.toString());

    try {
      const res = await fetch("https://cleezoclass.com:4000/enrollment", {
        method: "POST",
        body: form,
      });

      const result = await res.json();
      if (!res.ok) {
        setPopupMsg(result.message || "We were unable to save the enrollment details. Kindly try again.");
        return;
      }

      if (result.lead) {
        const lead = result.lead;
        setFormData(prev => ({
          ...prev,
          first_name: lead.student_name || "",
          last_name: lead.last_name || "",
          father_name: lead.full_name || "",
          mother_name: lead.mother_name || "",
          dob: lead.dob ? lead.dob.split("T")[0] : "",
          blood_group: lead.blood_group || "",
          admission_for: lead.lead_admission_for || "",
          branch: lead.branch || "",
          address: lead.address || "",
          tc_document_url: lead.tc_document || "",
          aadhar_document_url: lead.aadhar_document || "",
          dob_document_url: lead.dob_document || "",
          appeared_document_url: lead.appeared_document || "",
          father_id_url: lead.father_id || "",
          mother_id_url: lead.mother_id || "",
          address_proof_url: lead.address_proof || "",
          tc_document: null,
          aadhar_document: null,
          dob_document: null,
          appeared_document: null,
          father_id: null,
          mother_id: null,
          address_proof: null,
        }));

        if (onLeadUpdate) onLeadUpdate(lead);

        // Create login after enrollment
        const loginSuccess = await createLogin(formData, lead.id);
         if (loginSuccess) {
          setPopupMsg("Enrollment & Login Created Successfully!");
          setEnrolledStudent(result.lead);
          setIsFeeModalOpen(true);
        }
      } else {
        setPopupMsg("The data was saved, but no confirmation was received from the server.");
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      setPopupMsg(
        "An unexpected issue occurred while saving the enrollment. Kindly try again or contact support if the issue persists."
      );
    }
  };

  return (
    <Section title="" variant="lead" style={{ height: "100%", marginBottom: 0 }}>
      <div className="formWrapper" style={{ height: "100%" }}>
        <form style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Text Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="formRow">
              <InputField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} className="btn-dropdown-FeesManagement" />
              <InputField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} className="btn-dropdown-FeesManagement" />
            </div>
            <div className="formRow">
              <InputField label="Father Name" name="father_name" value={formData.father_name} onChange={handleChange} className="btn-dropdown-FeesManagement" />
              <InputField label="Mother Name" name="mother_name" value={formData.mother_name} onChange={handleChange} className="btn-dropdown-FeesManagement" />
            </div>
            <div className="formRow addressField">
              <InputField label="Address" name="address" value={formData.address} onChange={handleChange} className="btn-dropdown-FeesManagement" />
            </div>
            <div className="formRow">
              <InputField label="Branch" name="branch" value={formData.branch} onChange={handleChange} className="btn-dropdown-FeesManagement" />
              <InputField label="Admission For" name="admission_for" value={formData.admission_for} onChange={handleChange} className="btn-dropdown-FeesManagement" />
              <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} className="btn-dropdown-FeesManagement" />
              <InputField label="Blood Group" name="blood_group" value={formData.blood_group} onChange={handleChange} className="btn-dropdown-FeesManagement" />
            </div>
          </div>

          {/* File Uploads */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
            {(['tc_document','father_id','appeared_document','mother_id','dob_document','address_proof','aadhar_document'] as const).map(doc => {
              const labelMap: Record<string, string> = {
                appeared_document: "apaar",
                aadhar_document: 'Student Aadhar',
                father_id: 'Father Id',
                mother_id: 'Mother Id'
              };
              const label = labelMap[doc] || doc.replace('_',' ').toUpperCase();
              return (
                <div key={doc} style={{ flex: "0 0 35%", display: "flex", flexDirection: "column" }}>
                  <button type="button" className="registerBtn" onClick={() => document.getElementById(doc)?.click()}>
                    {label}
                  </button>
                  <input id={doc} type="file" name={doc} style={{ display: "none" }} onChange={handleFileChange} />
                  {formData[doc] && <span style={{ fontSize: "8px" }}>{(formData[doc] as File).name}</span>}
                  {!formData[doc] && formData[`${doc}_url` as keyof EnrollmentState] && (
                    <div style={{ fontSize: "10px", marginTop: "4px" }}>
                      Uploaded:{" "}
                      <a
                        href={`https://cleezoclass.com:4000/uploads/${formData[`${doc}_url` as keyof EnrollmentState]}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginLeft: "6px", color: "#007bff" }}
                      >
                        View
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
            <div
              style={{
                flex: "0 0 35%",
                border: "2px solid #FF6B6B",
                borderRadius: "16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                height: "40px"
              }}
              onClick={handleSubmit}
            >
              <img src={applicationIcon} style={{ width: "30px" }} alt="App" />
            </div>
          </div>
        </form>
      </div>
      <ErrorPopup message={popupMsg} onClose={() => setPopupMsg("")} />
         <AdmissionFeeModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        studentData={enrolledStudent}
      />
    </Section>
  );
};
const MarketingStatus: React.FC<{ leads: Lead[]; setLeads: (leads: Lead[]) => void; onSelectLead: (lead: Lead) => void; selectedLead: Lead | null }> = ({ leads, setLeads, onSelectLead, selectedLead }) => {
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    fetch(`${API_BASE_URL}/api/leads?schoolCode=${schoolCode}`)
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        if (data.length > 0 && !selectedLead) onSelectLead(data[0]);
      })
      .catch(err => console.error(err));
  }, []);

  const filteredLeads = leads.filter(lead => !selectedDate || new Date(lead.date).toISOString().split("T")[0] === selectedDate);

  return (
    <Section title="" variant="lead" style={{ height: "32vh", marginBottom: 0 }}>
    {/* DATE FILTER */}
    <div className="co-lead-header">
      {/* TITLE */}
      <div className="co-lead-title">Registered Leads</div>

      {/* DATE FILTER */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="co-date-input"
      />
    </div>

    {filteredLeads.length === 0 && (
      <p className="co-no-leads-text">No leads found for selected date.</p>
    )}

    {filteredLeads.map((lead, index) => {
      const formattedDate = new Date(lead.date).toISOString().split("T")[0];

      return (
        <div
          key={lead.id}
          onClick={() => onSelectLead(lead)}
          className={`co-lead-item ${
            selectedLead?.id === lead.id ? "co-lead-item-active" : ""
          }`}
        >
          {index !== filteredLeads.length - 1 && (
            <div className="co-lead-vertical-line" />
          )}

          <div className="co-lead-row">
            {/* DATE */}
            <div className="co-lead-date">
              <div className="co-lead-date-text">{formattedDate}</div>
              <div className="co-lead-time-text">{lead.lead_time}</div>
            </div>

            {/* USER ICON */}
            <div className="co-lead-avatar">
              <FaUser size={18} color="#404040" />
            </div>

            {/* DETAILS */}
            <div className="co-lead-details">
              <span className="co-lead-name">{lead.student_name}</span>{" "}
              class: {lead?.lead_admission_for || "N/A"},{" "}
              Contact <b>{lead.mobile_number}</b>
              <br />
              <a
                href={`mailto:${lead?.email_id || "xxxx@gmail.com"}`}
                className="co-lead-email"
              >
                {lead?.email_id || "xxxx@gmail.com"}
              </a>{" "}
              / Lead Source <b>{lead.entry_type?.toUpperCase()}</b>
            </div>
          </div>
        </div>
      );
    })}
  </Section>
);
};

const LeadProgressSection: React.FC<{
  lead: Lead | null;
  selectedTeacher?: Teacher;
}> = ({ lead, selectedTeacher }) => {
  if (!lead) return null;

  return (
    <Section title="" variant="lead" style={{ height: "39vh", marginBottom: 0 }}>
      <div className="co-lead-progress-container">
        {/* Top Row: Lead Information + Shortlisted */}
        <div className="co-lead-progress-header">
          <div className="co-lead-progress-title">Lead Information</div>
          <div className="co-lead-progress-status">
            <div className="co-lead-progress-status-title">Shortlisted</div>
            <div className="co-lead-progress-date">
              {new Date(lead.date).toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="co-lead-progress-name">
          <b>Name:</b>{" "}
          <span className="co-lead-progress-name-value">{lead.full_name}</span>
        </div>

        {/* Class, Contact, Email */}
        <div className="co-lead-progress-meta">
          <b>Class:</b> {lead.lead_admission_for} | {lead.mobile_number} |{" "}
          {lead.email_id}
        </div>

        {/* Row 1 */}
        <div className="co-lead-progress-row">
          {/* Assigned Counselor */}
          <div className="co-lead-progress-col">
            <div className="co-lead-progress-label">Assigned Counselor</div>
            <div className="co-lead-progress-text">
              <div>Name: {lead.assigned_teacher_name}</div>
              <div>Subject: {selectedTeacher?.subject || "N/A"}</div>
            </div>
          </div>

          {/* Communication Status */}
          <div className="co-lead-progress-col">
            <div className="co-lead-progress-label">Communication Status</div>
            <div className="co-lead-progress-text">
              <div>Email Sent: 10</div>
              <div>WhatsApp Sent: 20</div>
            </div>
          </div>

          {/* Details */}
          <div className="co-lead-progress-col">
            <div className="co-lead-progress-label">Details</div>
            <div className="co-lead-progress-text">
              <div>Class To: 9</div>
              <div>School: TSMS</div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="co-lead-progress-row">
          {/* Lead Source */}
          <div className="co-lead-progress-col">
            <div className="co-lead-progress-label">Lead Source</div>
            <div className="co-lead-progress-text">
              <div>
                Adds:{" "}
                {["manual", "automatic"].includes(
                  lead.entry_type?.toLowerCase()
                )
                  ? "Walk-in"
                  : lead.entry_type}
              </div>
            </div>
          </div>

          {/* Telephonic */}
          <div className="co-lead-progress-col lead-progress-telephonic">
            <div className="co-lead-progress-label">Telephonic</div>
            <div className="co-lead-progress-text">
              <div>Incoming: 10</div>
              <div>Outgoing: 20</div>
            </div>
          </div>

          {/* Empty spacer column */}
          <div className="co-lead-progress-col" />
        </div>
      </div>
    </Section>
  );
};






const Frontdesk_Communication: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  return (
    <div className="container" style={{ padding: '15px' }}>
      <div className="mainGrid">
        <div className="co-processHeading" style={{ marginBottom: '10px' }}>Enrolment</div>
        
        {/* Updated Layout Wrapper */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "20px", 
          alignItems: "stretch" 
        }}>
          
          {/* Left Column: Stacked Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <MarketingStatus 
              leads={leads} 
              setLeads={setLeads} 
              onSelectLead={setSelectedLead} 
              selectedLead={selectedLead} 
            />
            <LeadProgressSection lead={selectedLead} />
          </div>

          {/* Right Column: Full Height Enrollment */}
          <div style={{ height: "100%" }}>
            <EnrollmentSection selectedLead={selectedLead} />
          </div>

        </div>
      </div>
      
    </div>
    
  );
};

export default Frontdesk_Communication;