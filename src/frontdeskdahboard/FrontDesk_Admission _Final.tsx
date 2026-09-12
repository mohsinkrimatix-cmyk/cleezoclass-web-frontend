import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import '../STYLES/solidbutton.css';
import cameraIcon from '../assets/camera.png'; 
// import applicationIcon from '../assets/application.png';
import "./FrontDesk_Admission.css";
import ErrorPopup from "../shared/ErrorPopup";
import cleezo from "../assets/Cleezo.png";

// --- Interfaces ---
interface LeadFormData {
  student_name: string;
  full_name: string;
  occupation: string;
  mobile_number: string;
  email_id: string;
  address: string;
  dob: string;
  lead_admission_for: string;
  entry_type: "manual" | "automatic";
  refer_by:string
}

interface LeadResponse {
  reg_no: string;
  ticket_no: string;
  full_name: string;
  mobile_number: string;
  email_id: string;
  lead_admission_for: string;
}

interface Lead {
  id: string | number;
  date: string;
  lead_time: string;
  full_name: string;
  entry_type: string;
  mobile_number: string;
  email_id: string;
}

interface Teacher {
  id: string | number;
  name: string;
}

// --- Utility Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '15px',
    backgroundColor: '#f5f5f5',
  },
  processHeading: {
    textAlign: 'left',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#000',
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
  sectionContainer: {
    backgroundColor: '#FFF',
    padding: '12px',
    borderRadius: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    marginBottom: '15px',
    border: '4px solid #ddd',
    height: '20vh',
    overflowY: 'auto' as 'auto',
    overflowX: 'hidden' as 'hidden',
    width: '25vw',
    boxSizing: 'border-box' as 'border-box',
  },
sectionContainer1: {
  padding: '12px',
  borderRadius: '20px',
  marginBottom: '15px',
  height: 'auto',            // 🔥 important
  overflowY: 'auto' as 'auto',
  width: '100%',             // 🔥 important
  boxSizing: 'border-box' as 'border-box',
  backgroundColor: 'transparent',
},
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#404040',
    paddingBottom: '4px',
    textAlign: 'left' as 'left'
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
    textAlign: 'left' as 'left'
  },
  input: {
    padding: '6px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    fontSize: '12px',
    width: '150px',
    height: '25px'
  },
  input1: {
    padding: '6px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    fontSize: '12px',
    width: '100px',
    height: '25px'
  },
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999
};

const popupStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "10px",
  width: "320px",
  textAlign: "center",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  border: '2px solid #000'
};

const popupButton: React.CSSProperties = {
  marginTop: "20px",
  padding: "8px 20px",
  border: "none",
  borderRadius: "6px",
  backgroundColor: "#2563eb",
  color: "#fff",
  cursor: "pointer"
};

// --- Sub-Components ---

interface SectionProps {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "lead" | "marketing";
  style?: React.CSSProperties;
  className?: string; // <-- add this
}


const Section: React.FC<SectionProps> = ({ title, children, variant = "default", style = {}, className = "" }) => {
  const compactVariants = ["lead", "marketing"];
  const containerClass = compactVariants.includes(variant)
    ? "sectionContainer1"
    : "sectionContainer";

  return (
    <div className={`${containerClass} ${className}`} style={style}>
      <div className="sectionTitle">{title}</div>
      {children}
    </div>
  );
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

const LeadDetailsForm: React.FC = () => {
  const [formData, setFormData] = useState<LeadFormData>({
    student_name: "",
    full_name: "",
    occupation: "",
    mobile_number: "",
    email_id: "",
    address: "",
    dob: "",
    lead_admission_for: "",
    entry_type: "manual",
      refer_by: "",        

  });

  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [leadResponse, setLeadResponse] = useState<LeadResponse | null>(null);
  const [testDate, setTestDate] = useState("");
  const [showTeachersPopup, setShowTeachersPopup] = useState(false);
  const [testType, setTestType] = useState("");
  const [needsCounselling, setNeedsCounselling] = useState("");
  const [counsellingDate, setCounsellingDate] = useState("");
  const [counsellingTime, setCounsellingTime] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"error" | "success">("error");
  const [showFeeConfirmPopup, setShowFeeConfirmPopup] = useState(false);
  const [pendingWhatsappData, setPendingWhatsappData] = useState<any>(null);
  const [showAmountField, setShowAmountField] = useState(false);
  const [applicationAmount, setApplicationAmount] = useState("");

  const formatMobileNumber = (number: string): string | null => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 10) return "91" + cleaned;
    if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
    return null;
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "mobile_number") {
      formattedValue = value.replace(/\D/g, "").slice(0, 10);
    }
else if (["full_name", "student_name", "father_name", "occupation"].includes(name)) {
  // Keep only letters and spaces
  const onlyLetters = value.replace(/[^a-zA-Z ]/g, ""); // note: only space ' ' allowed

  // Capitalize each word, but preserve spaces exactly
  formattedValue = onlyLetters.replace(/\b\w+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}



    
    else if (name === "email_id") {
      formattedValue = value.slice(0, 100);
    } else if (["address", "school_name"].includes(name)) {
      formattedValue = value.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    setFormData({ ...formData, [name]: formattedValue });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const schoolCode = localStorage.getItem("schoolCode");

    if (!schoolCode) {
      setPopupMessage("School Code is missing. Please login again.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append("schoolCode", schoolCode);
    (Object.keys(formData) as Array<keyof LeadFormData>).forEach((key) => {
      dataToSend.append(key, formData[key]);
    });

    dataToSend.append("test_type", testType);
    dataToSend.append("test_date", testDate);
    dataToSend.append("counselling_required", needsCounselling);
    dataToSend.append("counselling_date", counsellingDate);
    dataToSend.append("counselling_time", counsellingTime);

    if (photo) dataToSend.append("photo", photo);

    try {
      const res = await fetch("https://cleezoclass.com:4000/api/add-lead", {
        method: "POST",
        body: dataToSend,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lead submission failed");

      setLeadResponse(data);
      const formattedMobile = formatMobileNumber(data.mobile_number);
      
      if (!formattedMobile) {
        setPopupMessage("Please enter a valid mobile number.");
        setPopupType("error");
        setShowPopup(true);
        return;
      }

      setPopupMessage("Lead submitted successfully!");
      setPopupType("success");
      setShowPopup(true);

      const posterUrl = `https://cleezoclass.com:4000/posters/school_poster_${data.reg_no}.png`;
      const loginLink = `https://cleezoclass.com/CRM/ParentAdmissionLogin?schoolCode=${encodeURIComponent(schoolCode)}`;
      const message = `Hi ${data.full_name}! 🎉\nYour child registration is successful.\n\nReg No: ${data.reg_no}\nTicket No: ${data.ticket_no}\n\n🔐 Parent Login: ${loginLink}\n🖼️ Download your registration poster: ${posterUrl}`;
      // Store WhatsApp data for later
setPendingWhatsappData({
  mobile: formattedMobile,
  message: message
});

// Open fee confirmation popup
setShowAmountField(false);
setShowFeeConfirmPopup(true);

      // Schedule daily poster email for 30 days (start immediately)
      if (data.email_id) {
        try {
          const schedule = [];
          const now = new Date();
          const immediateTime = new Date(now.getTime() + 60 * 1000);
          const immediateTimeStr = immediateTime.toTimeString().split(" ")[0];

          // 1) Send immediately (today, ~1 minute from now)
          schedule.push({
            leadId: data.id,
            leadName: data.full_name,
            phone: data.mobile_number,
            email: data.email_id,
            date: now.toISOString().split("T")[0],
            time: immediateTimeStr,
            channels: ["Mail", "WhatsApp"],
            message,
            schoolCode,
          });

          // 2) From next day at 10:00 AM for remaining 29 days
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 1);
          startDate.setHours(10, 0, 0, 0);
          const timeStr = "10:00:00";

          for (let i = 0; i < 29; i++) {
            const sendDate = new Date(startDate);
            sendDate.setDate(startDate.getDate() + i);

            schedule.push({
              leadId: data.id,
              leadName: data.full_name,
              phone: data.mobile_number,
              email: data.email_id,
              date: sendDate.toISOString().split("T")[0],
              time: timeStr,
              channels: ["Mail", "WhatsApp"],
              message,
              schoolCode,
            });
          }

          await fetch("https://cleezoclass.com:4000/api/schedule-messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedule, schoolCode }),
          });
        } catch (err) {
          console.error("Failed to schedule 30-day emails:", err);
        }
      }

     // window.open(`https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`, "_blank");

      if (needsCounselling === "Yes") {
        const teacherRes = await fetch(`https://cleezoclass.com:4000/api/chief/available-teachers/1/${formData.lead_admission_for}?schoolCode=${schoolCode}`);
        const teachers = await teacherRes.json();
        setAvailableTeachers(teachers);
        setShowTeachersPopup(true);
      }

      setFormData({
        student_name: "",
        full_name: "",
        occupation: "",
        mobile_number: "",
        email_id: "",
        address: "",
        dob: "",
         refer_by: "", 
        lead_admission_for: "",
        entry_type: "manual"
      });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err: any) {
      setPopupMessage(err.message);
      setPopupType("error");
      setShowPopup(true);
    }
  };
const maxDate = new Date();
maxDate.setFullYear( - 3); // maximum allowed DOB = 3 years ago

// Format YYYY-MM-DD
const maxDateStr = maxDate.toISOString().split("T")[0];
  return (
    <form onSubmit={handleSubmit}>
      <Section title="Lead Details" variant="lead">
        
 <div className="formWrapper">
  
  <div className="formColumn">
    {/* LEAD DETAILS - Parent Full Name, Occupation, etc. */}
    <div className="formRow">
      <InputField 
        label="Parent Full Name *"
        name="full_name"
        value={formData.full_name}
        onChange={handleChange}
        placeholder="Enter full name"
         className="btn-dropdown-FeesManagement" 
      />
      <InputField 
        label="Occupation"
        name="occupation"
        value={formData.occupation}
        onChange={handleChange}
        placeholder="Enter occupation (optional)"
         className="btn-dropdown-FeesManagement" 
      />
    </div>

    <div className="formRow">
      <InputField 
        label="Mobile Number *"
        name="mobile_number"
        value={formData.mobile_number}
        onChange={handleChange}
        placeholder="Mobile number"
        type="tel"
         className="btn-dropdown-FeesManagement" 
      />
      <InputField 
        label="Email Id"
        name="email_id"
        value={formData.email_id}
        onChange={handleChange}
        placeholder="Email address (optional)"
        type="email"
        className="btn-dropdown-FeesManagement" 
       />
    </div>

    {/* Address Field (Takes full width) */}
    <div className="formRow addressField">
      <InputField 
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Enter address (optional)"
        className="btn-dropdown-FeesManagement"
      />
    </div>

    {/* DOB and Admission Fields */}
    <div className="formRow">
         <InputField 
        label="Student Name *"
        name="student_name"
        value={formData.student_name}
        onChange={handleChange}
        placeholder="Student Name"
        className="btn-dropdown-FeesManagement"
       />

      <InputField 
        label="Admission *"
        name="lead_admission_for"
        value={formData.lead_admission_for}
        onChange={handleChange}
        placeholder="Lead Admission For"
        className="btn-dropdown-FeesManagement"
      />
    </div>
<div className="formRow">
  <InputField 
    label="Date Of Birth (DOB) *"
    name="dob"
    value={formData.dob}
    onChange={handleChange}
    placeholder="dd/mm/yyyy"
    type="date"
    className="btn-dropdown-FeesManagement"
  />

<InputField
  label="Refer By"
  name="refer_by"
  value={formData.refer_by}
  onChange={handleChange}
  placeholder="Refer By"
  className="btn-dropdown-FeesManagement"
/>

</div>



    {/* Register Button */}
    <div className="formRow">
        <InputField 
        label="Entry Type"
        name="entry_type"
        value={formData.entry_type}
        onChange={handleChange}
        className="btn-dropdown-FeesManagement"
       />
      <button type="submit" className="registerBtn">Register</button>
    </div>
  </div>

  {/* Camera Column (separate 20% space) */}
  <div className="cameraColumn">
    <div className="photoUploadWrapper" onClick={() => document.getElementById("photoInput")?.click()}>
      {photoPreview ? (
        <img src={photoPreview} alt="Preview" />
      ) : (
        <img src={cameraIcon} alt="Camera" className="cameraIcon" />
      )}
      <input 
        id="photoInput" 
        type="file" 
        accept="image/*" 
        style={{ display: "none" }} 
        onChange={handlePhotoChange} 
      />
      <label className="labelSmall">Student's photo</label>
    </div>
  </div>
</div>
      <ErrorPopup message={popupMessage} onClose={() => setShowPopup(false)} />

   {showFeeConfirmPopup && (
  <div className="feePopupOverlay">
  <div className="feePopupCard">

      {/* STEP 1 : YES / NO */}
      {!showAmountField && (
        <>
         <div className="sectionTitle" style={{ paddingLeft: 0 }}>
  Would you like to pay the application fee?
</div>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-around" }}>
            <button
              type="button"
              className="registerBtn"
              
              onClick={() => {
                if (pendingWhatsappData) {
                  window.open(
                    `https://wa.me/${pendingWhatsappData.mobile}?text=${encodeURIComponent(pendingWhatsappData.message)}`,
                    "_blank"
                  );
                }
                setShowFeeConfirmPopup(false);
              }}
            >
              No
            </button>

            <button
              type="button"
              className="registerBtn"
              
              onClick={() => {
                setShowAmountField(true);
              }}
            >
              Yes
            </button>
          </div>
        </>
      )}

      {/* STEP 2 : ENTER AMOUNT */}
      {showAmountField && (
        <>
          <div className="sectionTitle" style={{ paddingLeft: 0 }}>
  Enter the Amount
</div>

          <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="Enter the amount"
  value={applicationAmount}
  onChange={(e) =>
    setApplicationAmount(e.target.value.replace(/\D/g, ""))
  }
  style={{
    width: "100%",
    padding: "8px",
    marginTop: "15px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  }}
/>

          <button
  type="button"
  className="registerBtn"
  style={{ marginTop: "20px" }}
            onClick={() => {
  if (!applicationAmount) {
    alert("Please enter amount");
    return;
  }

  if (pendingWhatsappData) {

    const qrLink = "https://example.com/sample-qr.png"; // Replace later

    const paymentMessage =
      `Thank you for registering with Cleezo Class School. We’re excited to have you join our educational community!.\n\n` +
      `Application Fee Amount: ₹${applicationAmount}\n\n` +
      `Please complete the payment by scanning the QR code below:\n` +
      `${qrLink}`;

    // ✅ ONLY PAYMENT MESSAGE (No old message)
    window.open(
      `https://wa.me/${pendingWhatsappData.mobile}?text=${encodeURIComponent(paymentMessage)}`,
      "_blank"
    );
  }

  // Reset states
  setApplicationAmount("");
  setShowAmountField(false);
  setShowFeeConfirmPopup(false);
}}
          >
            Submit
          </button>
        </>
      )}

    </div>
  </div>
)}



</Section>

    </form>
  );
};

const TicketSection: React.FC = () => {
  const [regOrMobile, setRegOrMobile] = useState('');
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedRemarks, setSelectedRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState("");

const handleRaiseTicket = async () => {
try {
  if (!regOrMobile || !selectedIssueType || !selectedAction) {
    setErrorMsg(
      'Kindly ensure all required fields are filled before raising a ticket.'
    );
    return;
  }

    const schoolCode = localStorage.getItem('schoolCode');

    const response = await fetch('https://cleezoclass.com:4000/api/raise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        regNoOrMobile: regOrMobile,
        issueType: selectedIssueType,
        action: selectedAction,
        remarks: selectedRemarks,
        schoolCode
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setErrorMsg(`Ticket raised successfully for ${data.leadName} (Ticket No: ${data.ticketNo})`);
      // Reset form
      setRegOrMobile('');
      setSelectedIssueType('');
      setSelectedAction('');
      setSelectedRemarks('');
    } else {
      setErrorMsg(data.message || 'Failed to raise ticket');
    }
  } catch (err) {
    console.error(err);
    setErrorMsg('Error raising ticket. Please try again.');
  }
};


  return (
    <Section title="Ticket">
      <div className="ticketGrid">
        <div className="inputGroup">
          <label className="inputLabel">Reg. No. / Mobile No.</label>
          <input
            type="text"
            placeholder="Enter Reg/Mobile"
            className="input"
            value={regOrMobile}
            onChange={(e) => setRegOrMobile(e.target.value)}
          />
        </div>

        <div className="inputGroup">
          <label className="inputLabel">Issue Type</label>
          <select
            className="input"
            value={selectedIssueType}
            onChange={(e) => setSelectedIssueType(e.target.value)}
          >
            <option value="">Select Issue Type</option>
            <option>Unresponsive</option>
            <option>Unofficial</option>
            <option>Spam</option>
            <option>Duplicate</option>
            <option>Others</option>
          </select>
        </div>
      </div>

      <div className="ticketGrid mt15">
        <div className="inputGroup">
          <label className="inputLabel">Action</label>
          <select
            className="input"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="">Select Action</option>
            <option>Delete</option>
            <option>Re-Marketing</option>
          </select>
        </div>

        <div className="inputGroup">
          <label className="inputLabel">Remarks</label>
          <select
            className="input"
            value={selectedRemarks}
            onChange={(e) => setSelectedRemarks(e.target.value)}
          >
            <option value="">Select Remarks</option>
            <option>Spam</option>
            <option>Follow-up needed</option>
            <option>Other</option>
          </select>
        </div>

        <div className="generateBtnWrapper">
          <button className="btn-solid generateBtn" onClick={handleRaiseTicket}>
            Generate
          </button>
        </div>
      </div>
            <ErrorPopup message={errorMsg} onClose={() => setErrorMsg("")} />

    </Section>
  );
};


const MarketingStatus: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    fetch(`https://cleezoclass.com:4000/api/api/leads?schoolCode=${schoolCode}`)
      .then(res => res.json())
      .then(data => setLeads(data))
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  return (
<Section title="" variant="marketing" className="campaignSection">
  <div className="campaignHeader">
  <span className="Heading">Campaign Status</span>
  <span className="leadsCount">
    {leads.length} <span className="leadsLabel">LEADS AWAITING</span>
  </span>
</div>


  <div className="leadsList">
    {leads.map((lead, index) => {
      const formattedDate = new Date(lead.date).toISOString().split("T")[0];
      return (
        <div key={lead.id} className="leadItemWrapper">
          {index !== leads.length - 1 && <div className="leadConnector" />}
          
          <div className="leadContent">
            <div className="leadDate">
              <div className="leadDateValue">{formattedDate}</div>
              <div className="leadTime">{lead.lead_time}</div>
            </div>

           <div className="leadAvatar">
  {lead.full_name?.charAt(0).toUpperCase()}
</div>

            <div className="leadInfo">
              <span className="leadName">{lead.full_name}</span> showing interest via <b>{lead.entry_type?.toUpperCase()}</b>
              <br />
              Contact: {lead.mobile_number} / {lead.email_id}
            </div>
          </div>
        </div>
      );
    })}
  </div>
</Section>


  );
};



const CampaignStatus: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    fetch(`https://cleezoclass.com:4000/api/api/leads?schoolCode=${schoolCode}`)
      .then(res => res.json())
      .then(data => setLeads(data))
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  // Add one lead every 5 seconds
  useEffect(() => {
    if (leads.length === 0) return;

    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev < leads.length) {
          return prev + 1;
        }
        return prev; // stop when all leads shown
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [leads]);

  return (
    <Section title="" variant="marketing" className="campaignSection1">
      <div className="campaignHeader">
        <span className="Heading">Campaign Status</span>
        <span className="leadsCount">
          {leads.length} <span className="leadsLabel">LEADS AWAITING</span>
        </span>
      </div>

      <div className="leadsList">
        {leads.slice(0, visibleCount).map((lead, index) => {
          const formattedDate = new Date(lead.date)
            .toISOString()
            .split("T")[0];

          return (
            <div key={lead.id} className="leadItemWrapper">
              <div className="leadContent">
                <div className="leadDate">
                  <div className="leadDateValue">{formattedDate}</div>
                  <div className="leadTime">{lead.lead_time}</div>
                </div>

                <div className="leadAvatar">
                  <img
                    src={cleezo}
                    alt="logo"
                    className="leadAvatarLogo"
                  />
                </div>

                <div className="leadInfo">
                  <span className="leadName">{lead.full_name}</span> showing interest via{" "}
                  <b>{lead.entry_type?.toUpperCase()}</b>
                  <br />
                  Contact: {lead.mobile_number} / {lead.email_id}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

// const BulkLeadUpload: React.FC = () => {
//   const [file, setFile] = useState<File | null>(null);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [uploading, setUploading] = useState(false);

//   const handleTemplateDownload = () => {
//     const header = [
//       "student_name",
//       "full_name",
//       "occupation",
//       "mobile_number",
//       "email_id",
//       "address",
//       "dob",
//       "lead_admission_for",
//       "refer_by"
//     ];
//     const sample = [
//       "Student Name",
//       "Parent Full Name",
//       "Occupation",
//       "9876543210",
//       "parent@example.com",
//       "Hyderabad",
//       "2016-08-15",
//       "7",
//       "Campaign"
//     ];
//     const csv = [header.join(","), sample.join(",")].join("\n");
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = "bulk_leads_template.csv";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   const handleUpload = async () => {
//     setError("");
//     setStatus("");
//     const schoolCode = localStorage.getItem("schoolCode");
//     if (!schoolCode) {
//       setError("School Code is missing. Please login again.");
//       return;
//     }
//     if (!file) {
//       setError("Please select a CSV file to upload.");
//       return;
//     }

//     try {
//       setUploading(true);
//       const formData = new FormData();
//       formData.append("schoolCode", schoolCode);
//       formData.append("file", file);

//       const res = await fetch("https://cleezoclass.com:4000/api/leads/bulk-upload", {
//         method: "POST",
//         body: formData
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.error || "Bulk upload failed");

//       setStatus(
//         `Uploaded ${data.inserted || 0} leads. Skipped ${data.skipped || 0}.`
//       );
//       setFile(null);
//     } catch (err: any) {
//       setError(err.message || "Bulk upload failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <Section title="Bulk Lead Upload" variant="lead" style={{ marginTop: "12px" }}>
//       <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//         <div style={{ fontSize: "12px", color: "#555" }}>
//           Upload CSV with headers: student_name, full_name, occupation, mobile_number,
//           email_id, address, dob, lead_admission_for, refer_by
//         </div>
//         <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as "wrap" }}>
//           <input
//             type="file"
//             accept=".csv"
//             onChange={(e) => setFile(e.target.files?.[0] || null)}
//           />
//           <button
//             type="button"
//             className="btn-solid"
//             onClick={handleTemplateDownload}
//           >
//             Download Template
//           </button>
//           <button
//             type="button"
//             className="btn-solid"
//             onClick={handleUpload}
//             disabled={uploading}
//           >
//             {uploading ? "Uploading..." : "Upload Leads"}
//           </button>
//         </div>
//         {status && <div style={{ color: "green", fontSize: "12px" }}>{status}</div>}
//         {error && <div style={{ color: "red", fontSize: "12px" }}>{error}</div>}
//       </div>
//     </Section>
//   );
// };

const AdmissionCRM: React.FC = () => {
  return (
    <div className="container">
  <div className="mainGrid">
    <div className="processHeading">Admission</div>
    <div className="row">
      <div>
        <LeadDetailsForm />
        {/* <BulkLeadUpload /> */}
      </div>
      <div className="columnFlex">
        <MarketingStatus />
        <TicketSection />
      </div>
    </div>
  </div>
</div>

  );
};


export { MarketingStatus, CampaignStatus };
export default AdmissionCRM;