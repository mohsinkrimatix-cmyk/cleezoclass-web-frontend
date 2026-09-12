import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import './MouOrderForm.css'; 
import headerImg from '../assets/header.png';
import footerImg from '../assets/footer.png';
import qrImg from '../assets/qr.jpeg';

export default function SignMou() {
  const { id } = useParams();
  const [mou, setMou] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const sigRef = useRef<any>(null);
  const [data, setData] = useState({
    contactPerson: '',
    designation: '',
    schoolName: '',
    address: '',
    phone: '',
    email: '',
    totalAmount: '',
    advanceAmount: '',
    balanceAmount: '',
    executedDate: '',
    city: '',
    state: '',
    strength: '',
  });

  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [branchData, setBranchData] = useState({
    branchName: '',
    address: '',
    principalName: '',
    phone: '',
    email: '',
    strength: '',
  });
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [plan, setPlan] = useState('');
  const [moduleCount, setModuleCount] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [amountPerStudent, setAmountPerStudent] = useState('');

  // States for adding branches on this page
  const [branches, setBranches] = useState<any[]>([]);

 const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });

    // Recalculate total amount if strength changes
    if (name === 'strength' && amountPerStudent) {
      const total = parseFloat(amountPerStudent) * parseInt(value);
      setData({ ...data, [name]: value, totalAmount: total.toString() });
    }
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBranchData({ ...branchData, [e.target.name]: e.target.value });
  };

  const handleAddBranch = () => {
    if (!branchData.principalName.trim()) {
      alert('Principal Name is required');
      return;
    }
    if (!branchData.email.trim()) {
      alert('Email is required');
      return;
    }
    if (editingBranchIndex !== null) {
      // UPDATE EXISTING
      const updated = [...branches];
      updated[editingBranchIndex] = branchData;
      setBranches(updated);
    } else {
      // ADD NEW
      setBranches([...branches, branchData]);
    }
    // RESET
    setBranchData({
      branchName: '',
      address: '',
      principalName: '',
      phone: '',
      email: '',
      strength: '',
    });
    setEditingBranchIndex(null);
    setShowBranchPopup(false);
  };

  const handleDeleteBranch = () => {
    if (editingBranchIndex === null) return;
    const updated = branches.filter((_, i) => i !== editingBranchIndex);
    setBranches(updated);
    setEditingBranchIndex(null);
    setShowBranchPopup(false);
    setBranchData({
      branchName: '',
      address: '',
      principalName: '',
      phone: '',
      email: '',
      strength: '',
    });
  };

  const submit = async () => {
    try {
      const payload = {
        ...data,
        branches,
        plan,
        moduleCount,
        paymentType,
        amountPerStudent,
      };

      // Submit the form data
      await axios.post('https://cleezoclass.com:8443/api/submit', payload);

      

      alert('Submitted! A signing link has been sent to your email.');
    } catch (err) {
      console.error(err);
      alert('Failed to submit.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, JPG or PNG allowed');
      return;
    }
    setUploadedFile(file);
  };

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const cities: Record<string, string[]> = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kurnool"],
    "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Ziro"],
    "Assam": ["Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Tezpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Ponda"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Haryana": ["Chandigarh", "Gurgaon", "Faridabad", "Panipat", "Karnal"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali", "Mandi"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City"],
    "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Alappuzha"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
    "Meghalaya": ["Shillong", "Tura", "Nongpoh"],
    "Mizoram": ["Aizawl", "Lunglei", "Serchhip"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"],
    "Punjab": ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar", "Patiala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Bikaner", "Ajmer"],
    "Sikkim": ["Gangtok", "Namchi", "Geyzing"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    "Telangana": ["Hyderabad", "Warangal", "Hanamkonda", "Karimnagar", "Ramagundam"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Rishikesh"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Durgapur"],
    "Andaman and Nicobar Islands": ["Port Blair", "Car Nicobar"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu"],
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Karol Bagh"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
    "Ladakh": ["Leh", "Kargil"],
    "Lakshadweep": ["Kavaratti", "Agatti"],
    "Puducherry": ["Pondicherry", "Karaikal", "Mahe", "Yanam"]
  };

  const planModules: Record<string, string> = {
    starter: '20',
    standard: '40',
    enterprise: '80'
  };


  useEffect(() => {
    if (id) fetchMou();
  }, [id]);
const formatDate = (dateString?: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
const fetchMou = async () => {
  try {
    setLoading(true);
    const res = await axios.get(`https://cleezoclass.com:8443/api/mou/${id}`);

    console.log("MOU response:", res.data); // log the whole MOU object

    setMou(res.data);

    // Check for branches
    if (res.data.branches && res.data.branches.length > 0) {
      console.log("Branches found:", res.data.branches);
      setBranches(res.data.branches);
    } else {
      console.log("No branches found in this MOU");
      setBranches([]); // reset if none
    }
  } catch (error) {
    console.error("Error fetching MOU:", error);
    alert("Failed to fetch MOU details.");
  } finally {
    setLoading(false);
  }
};

const handleSign = async () => {
  try {
    if (uploadedFile) {
      // Case 1: User uploaded a PDF (full signed MOU)
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("branches", JSON.stringify(branches));

      await axios.post(
        `https://cleezoclass.com:8443/api/mou-upload-signed/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Successfully uploaded PDF! Email sent.");

    } else if (sigRef.current && !sigRef.current.isEmpty()) {
      // Case 2: User drew signature on canvas
      const signature = sigRef.current.toDataURL();

      await axios.post(`https://cleezoclass.com:8443/api/mou-sign/${id}`, { 
        signature,
        branches
      });

      alert("Successfully Signed! PDF sent to your email.");
    } else {
      alert("Please draw signature or upload signed PDF");
    }
  } catch (error) {
    console.error("Error submitting signature/uploaded file:", error);
    alert("Failed to submit signature or PDF.");
  }
};

  if (loading) return <div>Loading...</div>;
  if (!mou) return <div>MOU not found.</div>;
const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,       // number is fine (px)
  flexWrap: "wrap" as const // explicitly tell TS this is a valid FlexWrap
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flex: "1 1 45%",
  marginBottom: 8,
};

const labelStyle: React.CSSProperties = {
  width: 140,

};

const valueStyle: React.CSSProperties = {
  flex: 1,
};
// Calculate price per student dynamically
const pricePerStudent = (() => {
  const total = data.totalAmount || mou.totalAmount;
  const strength = data.strength || mou.strength;
  if (total && strength && parseInt(strength) !== 0) {
    return (parseFloat(total) / parseInt(strength)).toFixed(2);
  }
  return '';
})();
const numberOfStudents = mou.strength ? parseInt(mou.strength) : 0;
const totalAmount = mou.totalAmount ? parseFloat(mou.totalAmount) : 0;
  return (
    <table className="print-wrapper">
      <thead>
        <tr><td><img src={headerImg} alt="Header" className="header-img" /></td></tr>
      </thead>
      <tbody>
        <tr><td>
          <div className="page">
            <div className="title">MEMORANDUM OF UNDERSTANDING</div>

<p className="mou-line">
This Memorandum of Understanding (MOU) is made and executed on{" "}
<strong>{formatDate(mou.executedDate)}</strong>{" "}
at <strong>{mou.city}, {mou.state}</strong>.
</p>

<p><strong>BETWEEN</strong></p>

<p>
M/s <strong>CODENAUT PRIVATE LIMITED</strong>, having its registered office at
Capitol Tower, Plot No. 1, 2nd Floor, Beside N Convention, Khanamet,
Hitech City, Madhapur, Hyderabad, Telangana 500081, India,
represented by Director, hereinafter referred to as the <strong>First Party</strong>.
</p>

<p><strong>AND</strong></p>

<p>
M/s <strong>{mou.schoolName}</strong>
</p>

<p>
having its office at <strong>{mou.address}</strong>
</p>

<p>
India, represented by Mr. or Ms.{" "}
<strong>{mou.contactPerson}</strong>{" "}
hereinafter referred to as the <strong>Second Party</strong>.
</p>

<p>
The First party and Second Party are hereinafter individually referred to as a "Party"
and collectively as the "Parties".
</p>

<h4>1. PURPOSE OF THE MOU</h4>

<p>
The purpose of this MOU is to define the terms under which the First Party shall
provide a school management and communication platform to the Second Party,
and the Second Party shall subscribe to and use the platform for a minimum agreed term.
</p>

<h4>2. OBLIGATIONS OF THE SECOND PARTY</h4>

<ul>
<li>
The School or Institution shall submit a duly filled Order Form in the prescribed
format along with the first-year payment to the First Party.
</li>

<li>
The School or Institution agrees to continue the program for a minimum period
of two years from the date of deployment.
</li>

<li>
The School or Institution shall provide accurate and complete data required
for onboarding and platform setup in a timely manner.
</li>
</ul>

<h4>3. OBLIGATIONS OF THE FIRST PARTY</h4>

<p>
Upon receipt of the completed Order Form and required data, the First Party
shall provide login credentials and access details within <strong>ten days </strong>
of data submission.
</p>

<p>
The First Party shall provide a fully integrated web and mobile based school
management platform.
</p>

<h4>4. TOOL OVERVIEW</h4>

<p>The platform includes, but is not limited to, the following features:</p>

<ul>
<li>AI driven assistance for administrative operations</li>
<li>Centralized data management</li>
<li>Attendance tracking and reporting</li>
<li>Performance and academic management</li>
<li>Streamlined communication between school management, staff, and stakeholders</li>
</ul>

<h4>5. IMPLEMENTATION AND TRAINING</h4>

<ul>
<li>
The First Party shall assist in the deployment and configuration of the
platform within the School or Institution.
</li>

<li>
Training sessions shall be provided to school staff, teachers, and administrators
to ensure effective usage of the platform.
</li>
</ul>

<h4>6. TERMS OF PAYMENT</h4>

<h5>6.1 Initial Payment</h5>

<p>
To initiate the onboarding process, the Second Party shall make the following payments:
</p>

<ul>
<li>
Fifty percent of the student login charges based on the estimated annual student count.
</li>
</ul>

<h5>6.2 Annual Billing</h5>

<ul>
<li>The platform shall be billed annually.</li>
<li>The first invoice shall be raised upon deployment of the platform.</li>
<li>A Year-on-Year price escalation of 5 percent shall apply after completion of the first two years.</li>
</ul>

<h5>6.3 Payment Due Date</h5>

<p>
All payments shall be payable immediately upon receipt of invoice from the First Party.
</p>

<h4>7. STUDENT STRENGTH ADJUSTMENT</h4>

<p>
Any increase or decrease in student strength shall be reviewed annually,
and billing shall be adjusted accordingly for subsequent billing cycles.
</p>

<h4>8. PAYMENT DETAILS</h4>

<div className="payment-section">

<div className="bank-details">

<p>Payments may be made to:</p>

<p>
<strong>Account Name:</strong> Codenaut Private Limited<br/>
<strong>Account Number:</strong> 126520800000286<br/>
<strong>IFSC Code:</strong> YESB0001265<br/>
<strong>Bank Branch:</strong> Shaikpet, Hyderabad
</p>

<p>
Alternatively, payment may be made via UPI using the provided QR code.
</p>

</div>

<div className="qr-box">
<div className="scan-text">SCAN & PAY</div>

<img src={qrImg} alt="QR Code" className="qr-image"/>

<div className="upi-text">
UPI ID: yespay.mabs1265208wkito286@yesbank
</div>
</div>

</div>


            <div className="order-form-box">
              <h3 className="center">Order Form</h3>
<div style={{
  maxWidth: 800,
  margin: "0 auto",
  padding: 20,
  fontFamily: "Arial, sans-serif",
  fontSize: 14,
  color: "#333"
}}>

  {/* Row 1 (Single Box for School Name) */}
<div style={{ display: "flex", gap: 10, marginBottom: 10 }}>

  <div style={{
    flex: "1 1 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: "10px",
    textAlign: "left",
    minHeight: 30,
    display: "flex",
    alignItems: "center"
  }}>
    <span style={{ fontWeight: "bold", marginRight: 5 }}>
      SCHOOL / INSTITUTION NAME:
    </span>
    <strong>{mou.schoolName}</strong>
  </div>

  <div style={{
    flex: "1 1 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: "10px",
    textAlign: "left",
    minHeight: 30,
    display: "flex",
    alignItems: "center"
  }}>
    <span style={{ fontWeight: "bold", marginRight: 5 }}>
      CONTACT PERSON NAME:
    </span>
    <strong>{mou.contactPerson}</strong>
  </div>

</div>

  {/* Row 2 (Two Separate Boxes) */}
<div style={{ display: "flex", gap: 10, marginBottom: 10 }}>

  <div style={{
    flex: "1 1 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: "10px",
    textAlign: "left",
    minHeight: 30,
    display: "flex",
    alignItems: "center"
  }}>
       <span style={{ fontWeight: "bold", marginRight: 5 }}>
      Mail:
    </span>
    <strong>{mou.email}</strong>
  </div>

  <div style={{
    flex: "1 1 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: "10px",
    textAlign: "left",
    minHeight: 30,
    display: "flex",
    alignItems: "center"
  }}>
    <span style={{ fontWeight: "bold", marginRight: 5 }}>
      DESIGNATION:
    </span>
    <strong>{mou.designation}</strong>
  </div>

</div>

<div style={{ display: "flex", gap: 10, marginBottom: 10 }}>

  <div style={{
    flex: "1 1 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: "10px",
    textAlign: "left",
    minHeight: 30,
    display: "flex",
    alignItems: "center"
  }}>
    <span style={{ fontWeight: "bold", marginRight: 5 }}>
      ADDRESS:
    </span>
    <strong>{mou.address}</strong>
  </div>

  <div style={{
    flex: "1 1 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: "10px",
    textAlign: "left",
    minHeight: 30,
    display: "flex",
    alignItems: "center"
  }}>
    <span style={{ fontWeight: "bold", marginRight: 5 }}>
      PHONE NO:
    </span>
    <strong>{mou.phone}</strong>
  </div>

</div>

<div style={{ display: "flex", gap: 10, marginBottom: 10 }}>

  <div style={{
    flex: "1 1 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: "10px",
    textAlign: "left",
    minHeight: 30,
    display: "flex",
    alignItems: "center"
  }}>
    <span style={{ fontWeight: "bold", marginRight: 5 }}>
      STRENGTH:
    </span>
    <strong>{mou.strength}</strong>
  </div>

  <div style={{
    flex: "1 1 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: "10px",
    textAlign: "left",
    minHeight: 30,
    display: "flex",
    alignItems: "center"
  }}>
    <span style={{ fontWeight: "bold", marginRight: 5 }}>
      PRICE PER STUDENT (₹):
    </span>
    <strong>{pricePerStudent}</strong>
  </div>

</div>

</div>
          

              <button
                type="button"
                className="add-branch-btn"
                onClick={() => {
                  setEditingBranchIndex(null);
                  setBranchData({
                    branchName: '',
                    address: '',
                    principalName: '',
                    phone: '',
                    email: '',
                    strength: '',
                  });
                  setShowBranchPopup(true);
                }}
              >
                + Add Branch
              </button>

              {branches.length > 0 && (
                <div className="branch-list">
                  {branches.map((b, index) => (
                    <div
                      key={index}
                      className="branch-chip"
                      onClick={() => {
                        setBranchData(b);
                        setEditingBranchIndex(index);
                        setShowBranchPopup(true);
                      }}
                    >
                      Branch: {b.branchName} - {b.strength}
                    </div>
                  ))}
                </div>
              )}


              {showBranchPopup && (
                <div
                  className="popup-overlay"
                  onClick={() => {
                    setShowBranchPopup(false);
                    setEditingBranchIndex(null);
                  }}
                >
                  <div
                    className="popup-box"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3>{editingBranchIndex !== null ? 'Edit Branch' : 'Add Branch'}</h3>
                    <div className="popup-field">
                      <label>Branch Name</label>
                      <input
                        name="branchName"
                        value={branchData.branchName}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Address</label>
                      <input
                        name="address"
                        value={branchData.address}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Principal Name</label>
                      <input
                        name="principalName"
                        value={branchData.principalName}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Phone</label>
                      <input
                        name="phone"
                        autoComplete='off'
                        value={branchData.phone}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Email</label>
                      <input
                        name="email"
                        value={branchData.email}
                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-field">
                      <label>Strength</label>
                      <input
                        name="strength"
                        value={branchData.strength}

                        onChange={handleBranchChange}
                      />
                    </div>
                    <div className="popup-buttons">
                      <button type="button" onClick={handleAddBranch}>
                        {editingBranchIndex !== null ? 'Update Branch' : 'Submit Branch'}
                      </button>
                      {editingBranchIndex !== null && (
                        <button
                          type="button"
                          onClick={handleDeleteBranch}
                          style={{ background: '#e53935', color: 'white' }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowBranchPopup(false);
                          setEditingBranchIndex(null);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

           
            

       

              <h4 className="center">Payment Details </h4>
<table>
  <tbody>
    <tr>
      <td>Total Amount</td>
      <td>
        <strong>
          Number of students ({numberOfStudents}) × 
          Price per student ({pricePerStudent}) = 
          ₹{mou.totalAmount}
        </strong>
      </td>
    </tr>

    <tr>
      <td>Advance Amount</td>
      <td>
        <strong>
          ₹{mou.advanceAmount} 
          {mou.advancePaidDate && (
            <> (Paid on {formatDate(mou.advancePaidDate)})</>
          )}
        </strong>
      </td>
    </tr>

    <tr>
      <td>Balance Amount</td>
      <td>
        <strong>
          ₹{mou.balanceAmount}
          {mou.balancePaidDate && (
            <> (Due on {formatDate(mou.balancePaidDate)})</>
          )}
        </strong>
      </td>
    </tr>
  </tbody>
</table>
              {/* --- SIGNATURE SECTION --- */}
<div
  className="signature-area"
  style={{
    marginTop: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "30px",
    flexWrap: "wrap",
  }}
>
  {/* Signature Box */}
  <div style={{ textAlign: "center" }}>
    <h3 className="center">E-Signature</h3>
    <div style={{ border: "1px solid #000" }}>
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{
          width: 500,
          height: 200,
          className: "signatureCanvas",
        }}
      />
    </div>
<div className="no-print" style={{marginTop:'20px', fontSize:'14px', fontWeight:'bold'}}>(or)</div>
    {/* Upload + Print (Below Signature Box) */}
    <div
      style={{
        marginTop: "0px",
        display: "flex",
        justifyContent: "center",
        gap: "15px",
      }}
      className="no-print"
    >

      <button type="button" className="print-btn" onClick={handlePrint}>
        Print
      </button>
      <label className="upload-btn">
        Upload File
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          hidden
          onChange={handleFileUpload}
        />
      </label>

    </div>

    {/* File Preview */}
    {uploadedFile && (
      <div style={{ marginTop: "10px", fontSize: "14px" }}>
        <p>Selected File: {uploadedFile.name}</p>
        {uploadedFile.type.startsWith("image/") && (
          <img
            src={URL.createObjectURL(uploadedFile)}
            alt="Uploaded Preview"
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              marginTop: "8px",
            }}
          />
        )}
      </div>
    )}
  </div>

  {/* Clear + Sign Buttons (Right Side) */}
{/* Clear + Sign Buttons (Right Side) */}
<div
  style={{
    height: "200px", // same as canvas height
    display: "flex",
    flexDirection: "column",
    justifyContent: "center", // vertical center
    alignItems: "center",     // horizontal center
    gap: "15px",
    width: "120px",
    marginTop:'-100px'
  }}
>
  <button
    onClick={() => sigRef.current.clear()}
    className="print-btn"
    style={{ width: "150px" }}
  >
    Clear
  </button>

  <button
    onClick={handleSign}
    className="submit-btn"
    style={{ background: "green", width: "150px" }}
  >
    Sign & Submit
  </button>
</div>
</div>

<p style={{marginTop:"40px"}}>
Both the parties have affixed their signature as token of their acceptance to the terms and conditions as mentioned above:
</p>

<table className="signature-table">
<tbody>

<tr>
<td>
<strong>For M/s. CODENAUT PRIVATE LIMITED</strong>
</td>

<td>
<strong>For {mou.schoolName}</strong>
</td>
</tr>

<tr className="signature-space">
<td>
<strong>Partner/Marketing Partner</strong>
</td>

<td>
<div>Signature:</div>

<div className="signature-row-box">

<SignatureCanvas
  ref={sigRef}
  penColor="black"
  canvasProps={{
    width: 300,
    height: 80,
    className: "signatureCanvas"
  }}
/>

<button
  type="button"
  className="clear-btn"
  onClick={() => sigRef.current.clear()}
>
  Clear
</button>

</div>

<div className="designation-below-sign">
Director/Correspondent/Principal
</div>
</td>
</tr>

<tr>
<td>
<strong>M/s. CODENAUT PRIVATE LIMITED</strong><br/>
Capitol Tower, Plot No 1, 2nd Floor Beside N Convention,<br/>
Khanamet, Hitech City, Madhapur HYD, TG 500081
</td>

<td>
<label>Address:</label>
<div style={{marginTop:"6px"}}>
{mou.address}
</div>
</td>
</tr>

</tbody>
</table>
            </div>
          </div>
        </td></tr>
      </tbody>
      <tfoot>
        <tr><td><img src={footerImg} alt="Footer" className="footer-img" /></td></tr>
      </tfoot>

 
    </table>
  );
}